import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { useToast } from '../context/ToastContext.js';
import { downloadPdf, getApiErrorMessage } from '../services/api.js';
import { Icon, buttonClasses } from '../ui/primitives.js';

type ButtonOptions = Parameters<typeof buttonClasses>[0];

/**
 * Downloads a protected PDF with the session sent in the Authorization header,
 * so the token never appears in a URL, browser history or server logs.
 */
export const PdfDownloadButton: React.FC<{
  path: string;
  filename: string;
  title?: string;
  iconSize?: number;
  buttonOptions?: ButtonOptions;
  children: React.ReactNode;
}> = ({ path, filename, title, iconSize = 14, buttonOptions, children }) => {
  const { t: tr } = useLanguage();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      await downloadPdf(path, filename);
    } catch (err) {
      toast.error(getApiErrorMessage(err, tr('The PDF could not be downloaded. Try again.')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-busy={busy}
      title={title}
      className={buttonClasses(buttonOptions ?? { size: 'sm' })}
    >
      <Icon.Download size={iconSize} />
      <span>{children}</span>
    </button>
  );
};
