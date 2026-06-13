"use client";

import { FeedbackForm } from "@/components/feedback/FeedbackForm";

interface Props {
  projectId: string;
  projectName: string;
  hasPrompts?: boolean;
}

export function FeedbackFormWrapper({ projectId, projectName, hasPrompts }: Props) {
  return (
    <FeedbackForm
      projectId={projectId}
      projectName={projectName}
      hasPrompts={hasPrompts}
    />
  );
}
