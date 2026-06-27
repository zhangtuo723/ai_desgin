import { useEffect, useState } from 'react';

const modules = import.meta.glob('./pages/**/*.tsx');

function getPageNameFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('page') || 'Home.tsx';
}

export default function App() {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    const pageName = getPageNameFromUrl();
    const modulePath = `./pages/${pageName}`;
    const loader = modules[modulePath];

    if (!loader) {
      setComponent(null);
      return;
    }

    loader().then((mod: any) => {
      setComponent(() => mod.default ?? mod);
    });
  }, []);

  if (!Component) {
    return <div style={{ padding: 24 }}>Page not found.</div>;
  }

  return <Component />;
}
