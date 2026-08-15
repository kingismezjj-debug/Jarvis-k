export interface CoreHostBootstrapRuntimePort {
  hydrateMemory(): Promise<void>;
  hydrateTasks(): Promise<void>;
  hydrateCapabilities(): Promise<void>;
  announceReady(): void;
}

export interface CoreHostBootstrapInput {
  readonly runtime: CoreHostBootstrapRuntimePort;
  readonly hydrateMemory: boolean;
}

export async function hydrateCoreHostAndAnnounceReady(
  input: CoreHostBootstrapInput,
): Promise<void> {
  try {
    await Promise.all([
      ...(input.hydrateMemory ? [input.runtime.hydrateMemory()] : []),
      input.runtime.hydrateTasks(),
      input.runtime.hydrateCapabilities(),
    ]);
  } finally {
    input.runtime.announceReady();
  }
}

export interface CoreHostDisposableResource {
  dispose?(): void | Promise<void>;
  close?(): void | Promise<void>;
}

export async function disposeCoreHostResources(
  resources: readonly CoreHostDisposableResource[],
): Promise<void> {
  for (const resource of resources) {
    if (resource.dispose) {
      await resource.dispose();
      continue;
    }
    await resource.close?.();
  }
}
