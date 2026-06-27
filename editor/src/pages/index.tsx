import Head from 'next/head';
import Editor from '@/components/Editor';

export default function Home() {
  return (
    <>
      <Head>
        <title>Vite TSX Editor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Editor />
    </>
  );
}
