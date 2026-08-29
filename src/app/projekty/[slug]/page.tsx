import type { Metadata } from "next";
import { ProjectWorkspace } from "@/components/project-workspace";

export const metadata: Metadata = { title: "Projekt Kuchnia Palmowa" };

export function generateStaticParams() {
  return [{ slug: "palmowa" }];
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  await params;
  return <ProjectWorkspace />;
}
