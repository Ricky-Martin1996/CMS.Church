import type { Metadata } from "next";
import { MinistryDetailView } from "@/components/ministries/ministry-detail-view";

export const metadata: Metadata = {
  title: "Ministry",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MinistryDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <MinistryDetailView ministryId={id} />;
}
