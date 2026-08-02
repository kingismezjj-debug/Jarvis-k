from __future__ import annotations

import json
import math
import os
import re
import sys
import uuid
from contextlib import redirect_stdout
from datetime import datetime, timezone
from io import StringIO
from typing import Any

PROTOCOL_VERSION = 1
RUNTIME_NAME = "transformers"
TRANSPORT_NAME = "private-child-process-ipc"
MAX_LINE_BYTES = 8 * 1024 * 1024
MAX_INPUTS = 128
MAX_TEXT_LENGTH = 20_000
MAX_TOKEN_LENGTH = 8192
IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$")
ERROR_MESSAGES = {
    "HELPER_UNAVAILABLE": "Runtime helper is unavailable.",
    "HELPER_STARTUP_TIMEOUT": "Runtime helper startup timed out.",
    "HELPER_SHUTDOWN_TIMEOUT": "Runtime helper shutdown timed out.",
    "HELPER_REQUEST_TIMEOUT": "Runtime helper request timed out.",
    "HELPER_PROTOCOL_INVALID": "Runtime helper protocol message is invalid.",
    "RESOURCE_LEASE_REQUIRED": "A resource lease is required before runtime use.",
    "MODEL_LOAD_UNAVAILABLE": "Runtime helper cannot load the requested model.",
    "RUNTIME_DEPENDENCY_UNAVAILABLE": "Runtime helper dependencies are unavailable.",
    "MODEL_ARTIFACT_UNAVAILABLE": "Runtime helper model artifacts are unavailable.",
    "MODEL_RUNTIME_INCOMPATIBLE": (
        "Runtime helper model is incompatible with the configured runtime."
    ),
    "EMBEDDING_DIMENSIONS_UNSUPPORTED": (
        "Requested embedding dimensions are not supported by the loaded model."
    ),
    "EMBEDDING_EXECUTION_DISABLED": (
        "Embedding execution remains disabled by the runtime gate."
    ),
    "HELPER_PROCESS_EXITED": "Runtime helper process exited unexpectedly.",
    "HELPER_INTERNAL": "Runtime helper failed with a sanitized error.",
}
RETRYABLE_CODES = {
    "HELPER_UNAVAILABLE",
    "HELPER_STARTUP_TIMEOUT",
    "HELPER_REQUEST_TIMEOUT",
    "HELPER_PROCESS_EXITED",
    "HELPER_INTERNAL",
    "RUNTIME_DEPENDENCY_UNAVAILABLE",
}

with redirect_stdout(StringIO()):
    try:
        import torch
        from transformers import AutoModel, AutoTokenizer

        DEPENDENCIES_AVAILABLE = True
    except Exception:
        torch = None
        AutoModel = None
        AutoTokenizer = None
        DEPENDENCIES_AVAILABLE = False

model: Any = None
tokenizer: Any = None
loaded_model_id: str | None = None
session_id: str | None = None
embedding_dimensions: int | None = None


class HelperFailure(Exception):
    def __init__(self, code: str):
        self.code = code


def utc_now() -> str:
    return (
        datetime.now(timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )


def is_identifier(value: Any) -> bool:
    return isinstance(value, str) and bool(IDENTIFIER_PATTERN.fullmatch(value))


def is_safe_model_id(value: Any) -> bool:
    return (
        isinstance(value, str)
        and 1 <= len(value) <= 300
        and "\x00" not in value
        and "\\" not in value
        and "://" not in value
        and "?" not in value
        and "#" not in value
        and not re.match(r"^[A-Za-z]:", value)
    )


def is_record(value: Any) -> bool:
    return isinstance(value, dict)


def require_exact_keys(record: dict[str, Any], keys: set[str]) -> None:
    if set(record.keys()) != keys:
        raise HelperFailure("HELPER_PROTOCOL_INVALID")


def require_keys(
    record: dict[str, Any],
    required_keys: set[str],
    optional_keys: set[str],
) -> None:
    record_keys = set(record.keys())
    if (
        not required_keys.issubset(record_keys)
        or bool(record_keys - required_keys - optional_keys)
    ):
        raise HelperFailure("HELPER_PROTOCOL_INVALID")


def require_request_base(request: Any) -> tuple[str, str, str]:
    if not is_record(request):
        raise HelperFailure("HELPER_PROTOCOL_INVALID")
    if request.get("protocolVersion") != PROTOCOL_VERSION:
        raise HelperFailure("HELPER_PROTOCOL_INVALID")
    request_id = request.get("requestId")
    correlation_id = request.get("correlationId")
    operation = request.get("operation")
    if not is_identifier(request_id) or not is_identifier(correlation_id):
        raise HelperFailure("HELPER_PROTOCOL_INVALID")
    if operation not in {"health", "load", "embed", "shutdown"}:
        raise HelperFailure("HELPER_PROTOCOL_INVALID")
    return request_id, correlation_id, operation


def sanitized_error(code: str) -> dict[str, Any]:
    safe_code = code if code in ERROR_MESSAGES else "HELPER_INTERNAL"
    return {
        "code": safe_code,
        "message": ERROR_MESSAGES[safe_code],
        "retryable": safe_code in RETRYABLE_CODES,
    }


def response_base(
    request_id: str, correlation_id: str, operation: str
) -> dict[str, Any]:
    return {
        "protocolVersion": PROTOCOL_VERSION,
        "requestId": request_id,
        "correlationId": correlation_id,
        "operation": operation,
        "completedAt": utc_now(),
    }


def success_response(
    request_id: str,
    correlation_id: str,
    operation: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    return {
        **response_base(request_id, correlation_id, operation),
        "ok": True,
        "payload": payload,
    }


def error_response(
    request_id: str,
    correlation_id: str,
    operation: str,
    code: str,
) -> dict[str, Any]:
    return {
        **response_base(request_id, correlation_id, operation),
        "ok": False,
        "error": sanitized_error(code),
    }


def health_payload() -> dict[str, Any]:
    runtime_ready = DEPENDENCIES_AVAILABLE
    model_ready = model is not None
    return {
        "runtime": RUNTIME_NAME,
        "status": "ready" if runtime_ready else "failed",
        "processState": "ready" if runtime_ready else "failed",
        "transport": TRANSPORT_NAME,
        "resourceLeaseRequired": True,
        "directShellExecutionAllowed": False,
        "runtimeDependenciesIntroduced": True,
        "downloadEnabled": False,
        "executionEnabled": runtime_ready,
        "modelArtifactsAccessed": model_ready,
        "reasons": (
            [
                "Python Transformers runtime dependencies are available.",
                "Network downloads and remote code execution are disabled.",
            ]
            if runtime_ready
            else [
                "Required Python Transformers runtime dependencies are unavailable."
            ]
        ),
    }


def handle_health(request: dict[str, Any]) -> dict[str, Any]:
    payload = request.get("payload")
    if not is_record(payload) or payload:
        raise HelperFailure("HELPER_PROTOCOL_INVALID")
    return health_payload()


def handle_load(request: dict[str, Any]) -> dict[str, Any]:
    payload = request.get("payload")
    if not is_record(payload):
        raise HelperFailure("HELPER_PROTOCOL_INVALID")
    require_exact_keys(payload, {"modelId", "capability", "resourceLeaseId"})
    model_id = payload.get("modelId")
    capability = payload.get("capability")
    resource_lease_id = payload.get("resourceLeaseId")
    if (
        not is_safe_model_id(model_id)
        or capability != "embedding"
        or not is_identifier(resource_lease_id)
    ):
        raise HelperFailure("HELPER_PROTOCOL_INVALID")
    if not DEPENDENCIES_AVAILABLE:
        raise HelperFailure("RUNTIME_DEPENDENCY_UNAVAILABLE")

    model_directory = os.environ.get("JARVIS_K_TRANSFORMERS_MODEL_DIR")
    if not model_directory or not os.path.isdir(model_directory):
        raise HelperFailure("MODEL_ARTIFACT_UNAVAILABLE")

    load_model(model_directory, model_id)
    return {
        "sessionId": session_id,
        "modelId": model_id,
        "capability": "embedding",
        "loadedAt": utc_now(),
    }


def load_model(model_directory: str, model_id: str) -> None:
    global model, tokenizer, loaded_model_id, session_id, embedding_dimensions

    try:
        tokenizer = AutoTokenizer.from_pretrained(
            model_directory,
            local_files_only=True,
            trust_remote_code=False,
        )
        model = AutoModel.from_pretrained(
            model_directory,
            local_files_only=True,
            trust_remote_code=False,
        )
        model.to("cpu")
        model.eval()
        config = getattr(model, "config", None)
        dimensions = getattr(config, "hidden_size", None)
        if not isinstance(dimensions, int) or dimensions <= 0:
            dimensions = getattr(config, "d_model", None)
        if not isinstance(dimensions, int) or dimensions <= 0:
            raise ValueError("unsupported model dimensions")
        embedding_dimensions = dimensions
        loaded_model_id = model_id
        session_id = f"session-{uuid.uuid4().hex[:32]}"
    except HelperFailure:
        clear_model()
        raise
    except Exception:
        clear_model()
        raise HelperFailure("MODEL_RUNTIME_INCOMPATIBLE")


def clear_model() -> None:
    global model, tokenizer, loaded_model_id, session_id, embedding_dimensions
    model = None
    tokenizer = None
    loaded_model_id = None
    session_id = None
    embedding_dimensions = None


def handle_embed(request: dict[str, Any]) -> dict[str, Any]:
    payload = request.get("payload")
    if not is_record(payload):
        raise HelperFailure("HELPER_PROTOCOL_INVALID")
    require_exact_keys(payload, {"sessionId", "resourceLeaseId", "request"})
    request_session_id = payload.get("sessionId")
    resource_lease_id = payload.get("resourceLeaseId")
    embedding_request = payload.get("request")
    if (
        not is_identifier(request_session_id)
        or not is_identifier(resource_lease_id)
        or not is_record(embedding_request)
    ):
        raise HelperFailure("HELPER_PROTOCOL_INVALID")
    require_keys(embedding_request, {"modelId", "inputs"}, {"dimensions"})
    if embedding_request.get("dimensions") is None:
        embedding_request.pop("dimensions", None)
    model_id = embedding_request.get("modelId")
    inputs = embedding_request.get("inputs")
    requested_dimensions = embedding_request.get("dimensions")
    if (
        not is_safe_model_id(model_id)
        or not isinstance(inputs, list)
        or not 1 <= len(inputs) <= MAX_INPUTS
        or (
            requested_dimensions is not None
            and (
                not isinstance(requested_dimensions, int)
                or requested_dimensions <= 0
                or requested_dimensions > 8192
            )
        )
    ):
        raise HelperFailure("HELPER_PROTOCOL_INVALID")
    if (
        model is None
        or tokenizer is None
        or loaded_model_id != model_id
        or session_id != request_session_id
        or embedding_dimensions is None
    ):
        raise HelperFailure("MODEL_LOAD_UNAVAILABLE")
    if (
        requested_dimensions is not None
        and requested_dimensions != embedding_dimensions
    ):
        raise HelperFailure("EMBEDDING_DIMENSIONS_UNSUPPORTED")

    texts: list[str] = []
    input_ids: list[str | None] = []
    for item in inputs:
        if not is_record(item):
            raise HelperFailure("HELPER_PROTOCOL_INVALID")
        require_keys(item, {"text"}, {"id"})
        text = item.get("text")
        input_id = item.get("id")
        if (
            not isinstance(text, str)
            or not text.strip()
            or len(text) > MAX_TEXT_LENGTH
            or (input_id is not None and not is_identifier(input_id))
        ):
            raise HelperFailure("HELPER_PROTOCOL_INVALID")
        texts.append(text)
        input_ids.append(input_id)

    try:
        max_length = getattr(tokenizer, "model_max_length", MAX_TOKEN_LENGTH)
        if not isinstance(max_length, int) or max_length <= 0:
            max_length = MAX_TOKEN_LENGTH
        max_length = min(max_length, MAX_TOKEN_LENGTH)
        encoded = tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=max_length,
            return_tensors="pt",
        )
        with torch.no_grad():
            outputs = model(**encoded)
            last_hidden_state = getattr(outputs, "last_hidden_state", None)
            attention_mask = encoded.get("attention_mask")
            if last_hidden_state is None or attention_mask is None:
                raise ValueError("model output is missing hidden state")
            hidden_state = last_hidden_state.to(dtype=torch.float32)
            mask = attention_mask.unsqueeze(-1).expand(hidden_state.size())
            mask = mask.to(dtype=torch.float32)
            pooled = (hidden_state * mask).sum(dim=1)
            pooled = pooled / mask.sum(dim=1).clamp(min=1e-9)
            pooled = torch.nn.functional.normalize(pooled, p=2, dim=1)
            values = pooled.detach().to("cpu").tolist()
    except HelperFailure:
        raise
    except Exception:
        raise HelperFailure("MODEL_RUNTIME_INCOMPATIBLE")

    vectors = []
    for input_id, vector in zip(input_ids, values):
        numeric_values = [float(value) for value in vector]
        if not all(math.isfinite(value) for value in numeric_values):
            raise HelperFailure("MODEL_RUNTIME_INCOMPATIBLE")
        item: dict[str, Any] = {"values": numeric_values}
        if input_id is not None:
            item["inputId"] = input_id
        vectors.append(item)

    return {
        "modelId": model_id,
        "dimensions": embedding_dimensions,
        "vectors": vectors,
        "generatedAt": utc_now(),
    }


def handle_shutdown(request: dict[str, Any]) -> dict[str, Any]:
    payload = request.get("payload")
    if not is_record(payload):
        raise HelperFailure("HELPER_PROTOCOL_INVALID")
    require_exact_keys(payload, {"reason"})
    if payload.get("reason") not in {
        "app_shutdown",
        "supervisor_restart",
        "request_cancelled",
        "test",
    }:
        raise HelperFailure("HELPER_PROTOCOL_INVALID")
    clear_model()
    return {"status": "stopped"}


def handle_request(request: Any) -> dict[str, Any] | None:
    try:
        request_id, correlation_id, operation = require_request_base(request)
    except HelperFailure:
        return None

    try:
        if operation == "health":
            payload = handle_health(request)
        elif operation == "load":
            payload = handle_load(request)
        elif operation == "embed":
            payload = handle_embed(request)
        else:
            payload = handle_shutdown(request)
        return success_response(request_id, correlation_id, operation, payload)
    except HelperFailure as error:
        return error_response(
            request_id,
            correlation_id,
            operation,
            error.code,
        )
    except Exception:
        return error_response(
            request_id,
            correlation_id,
            operation,
            "HELPER_INTERNAL",
        )


def write_response(response: dict[str, Any]) -> None:
    serialized = json.dumps(
        response,
        ensure_ascii=False,
        separators=(",", ":"),
        allow_nan=False,
    )
    sys.stdout.write(serialized + "\n")
    sys.stdout.flush()


def main() -> None:
    for raw_line in sys.stdin:
        if len(raw_line.encode("utf-8")) > MAX_LINE_BYTES:
            continue
        if not raw_line.strip():
            continue
        try:
            request = json.loads(raw_line)
        except Exception:
            continue
        response = handle_request(request)
        if response is not None:
            write_response(response)
        if (
            isinstance(request, dict)
            and request.get("operation") == "shutdown"
        ):
            break


if __name__ == "__main__":
    main()
