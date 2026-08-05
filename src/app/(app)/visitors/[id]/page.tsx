import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVisitorProfileAction } from "@/application/visitors/actions";
import {
  VisitorProfileView,
  type SerializedVisitorProfile,
} from "@/components/visitors/visitor-profile-view";

export const metadata: Metadata = {
  title: "Visitor Profile",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function VisitorProfilePage({ params }: PageProps) {
  const { id } = await params;
  const result = await getVisitorProfileAction(id);

  if (!result.ok) {
    notFound();
  }

  const profile = JSON.parse(
    JSON.stringify(result.data)
  ) as SerializedVisitorProfile;

  return <VisitorProfileView profile={profile} />;
}
