import { useEffect, useRef } from 'react';

/**
 * Custom hook to dynamically update the document/tab title.
 * Formats title as: `${title} | MedraLink Enterprise Health`
 * Restores previous title upon unmount if retainOnUnmount is false.
 */
export function useDocumentTitle(title: string, retainOnUnmount: boolean = false): void {
  const defaultTitle = useRef(document.title);

  useEffect(() => {
    const formattedTitle = title.trim()
      ? `${title.trim()} | MedraLink Enterprise Health`
      : 'MedraLink — Unified Healthcare & Prescription Integrity Network';

    document.title = formattedTitle;

    return () => {
      if (!retainOnUnmount) {
        document.title = defaultTitle.current;
      }
    };
  }, [title, retainOnUnmount]);
}

export default useDocumentTitle;
