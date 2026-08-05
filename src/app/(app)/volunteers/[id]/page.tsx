import type { Metadata } from "next";
import { VolunteerProfileView } from "@/components/volunteers/volunteer-profile-view";

export const metadata: Metadata = {
  title: "Volunteer Profile",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function VolunteerProfilePage({ params }: PageProps) {
  const { id } = await params;
  return <VolunteerProfileView volunteerId={id} />;
}
