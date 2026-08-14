type PluginInput = Readonly<Record<string, string | number | boolean>>;

export async function helloLookup(input: PluginInput) {
  const name = typeof input.name === "string" ? input.name.trim() : "developer";
  return {
    summary: `Hello ${name}. This read-only local plugin template returned a sanitized result.`,
    items: [
      {
        title: "Template result",
        fields: [
          {
            label: "Capability",
            value: "hello.lookup",
          },
          {
            label: "Risk",
            value: "read_only",
          },
        ],
      },
    ],
  };
}
