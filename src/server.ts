import { McpServer } from "skybridge/server";
import { z } from "zod";

const server = new McpServer(
  {
    name: "alpic-openai-app",
    version: "0.0.1",
  },
  { capabilities: {} },
)
  .registerTool(
    {
      name: "start",
      description: "Onboard Skybridge",
      inputSchema: {
        name: z.string().optional().describe("The user name."),
      },
      annotations: {
        title: "Start Skybridge onboarding",
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      _meta: {
        "openai/toolInvocation/invoking": "Starting the Skybridge onboarding…",
        "openai/toolInvocation/invoked": "Onboarding ready.",
      },
      view: {
        component: "onboarding",
        // Replace with the URL your widget will be served from in production.
        domain: "https://skybridge.tech",
        description: "Onboarding deck",
        csp: {
          resourceDomains: [
            "https://fonts.googleapis.com",
            "https://fonts.gstatic.com",
          ],
          redirectDomains: ["https://docs.skybridge.tech"],
        },
      },
    },
    async ({ name }) => {
      return {
        structuredContent: { name },
        content: [{ type: "text", text: `User name: ${name ?? "friend"}` }],
        isError: false,
      };
    },
  )
  .registerTool(
    {
      name: "get-fortune-cookie",
      description: "Get fortune cookie",
      annotations: {
        title: "Get a fortune cookie",
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      _meta: {
        "openai/toolInvocation/invoking": "Cracking open a fortune cookie…",
        "openai/toolInvocation/invoked": "Fortune revealed.",
      },
    },
    async () => {
      const predictions = [
        "A pleasant surprise is waiting for you.",
        "Your hard work will soon pay off.",
        "An unexpected friendship will brighten your week.",
        "The best is yet to come.",
        "A small step today leads to a giant leap tomorrow.",
        "Trust your instincts: they are sharper than you think.",
        "Adventure awaits just around the corner.",
        "A long-forgotten idea will return with great success.",
        "Kindness given today will be returned threefold.",
        "Something you lost will soon be found.",
      ];
      const prediction =
        predictions[Math.floor(Math.random() * predictions.length)];

      // simulate backend work
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        structuredContent: { prediction },
        content: [{ type: "text", text: prediction }],
        isError: false,
      };
    },
  );

export default await server.run();

export type AppType = typeof server;

registerTool({
  name: "run-correlation-analysis",
  description: "Menjalankan analisis korelasi antar metrik ritel (penjualan, traffic, konversi, etc.)",
  inputSchema: {
    dateRange: z.object({
      start: z.string().describe("YYYY-MM-DD"),
      end: z.string().describe("YYYY-MM-DD")
    }),
    metrics: z.array(z.enum(["sales", "traffic", "conversion", "aov", "cart_abandon"])),
    segment: z.enum(["all", "by_category", "by_region", "by_device"]).optional(),
    correlationMethod: z.enum(["pearson", "spearman"]).default("pearson")
  },
  annotations: {
    title: "Analisis Korelasi Ritel",
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true
  },
  view: {
    component: "correlation-dashboard",
    domain: "https://your-app.alpic.live",
    description: "Dashboard korelasi ritel real-time"
  }
}, async ({ dateRange, metrics, segment, correlationMethod }) => {
  // 1. Fetch data dari source (CSV/DB/API)
  const rawData = await fetchRetailData(dateRange, metrics, segment);
  
  // 2. Hitung korelasi
  const correlationMatrix = computeCorrelation(rawData, correlationMethod);
  
  // 3. Deteksi anomali (korelasi > 0.8 atau < -0.8)
  const insights = generateInsights(correlationMatrix);
  
  return {
    structuredContent: {
      matrix: correlationMatrix,
      insights,
      summary: `Ditemukan ${insights.length} korelasi kuat dalam periode ${dateRange.start} s.d ${dateRange.end}`
    },
    content: [{ type: "text", text: JSON.stringify({ correlationMatrix, insights }, null, 2) }],
    isError: false
  };
})

.registerTool({
  name: "export-report",
  description: "Ekspor laporan analisis dalam format PDF/Excel/CSV",
  inputSchema: {
    format: z.enum(["pdf", "excel", "csv"]),
    correlationId: z.string().describe("ID hasil analisis dari run-correlation-analysis")
  }
}, async ({ format, correlationId }) => {
  const result = await getCorrelationResult(correlationId);
  const file = await generateExport(result, format);
  return {
    structuredContent: { downloadUrl: file.url, format },
    content: [{ type: "text", text: `Laporan ${format} siap diunduh: ${file.url}` }],
    isError: false
  };
})
