import { Suspense } from 'react';
import { PostContent } from './post-content';
import { PageLayout } from "@/components/layout/page-layout";
import { LoadingSpinner } from "@/components/loading-spinner";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  
  return (
    <PageLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <PostContent id={id} />
      </Suspense>
    </PageLayout>
  );
}