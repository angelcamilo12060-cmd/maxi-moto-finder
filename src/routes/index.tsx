import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const VehicleInspectionApp = lazy(() => import("../components/VehicleInspectionApp.jsx"));

const title = "Maxi Moto Bcn — Inspección de vehículos";
const description =
  "App de inspección de motos de alquiler: daños, limpieza, combustible, accesorios, firma y exportación a PDF.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly fallback={<div className="min-h-screen bg-background" />}>
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <VehicleInspectionApp />
      </Suspense>
    </ClientOnly>
  );
}
