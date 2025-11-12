import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Eye, Download, FileText } from 'lucide-react';
import { ReportHeader } from './ReportHeader';

interface ReportDetailHeaderProps {
  reportId: string;
  title: string;
  isPreviewMode: boolean;
  onBack: () => void;
  onSaveTitle: (newTitle: string) => Promise<void>;
  onToggleMode: () => void;
  onExportPdf?: () => void;
  onExportHtml?: () => void;
}

export function ReportDetailHeader({
  reportId,
  title,
  isPreviewMode,
  onBack,
  onSaveTitle,
  onToggleMode,
  onExportPdf,
  onExportHtml,
}: ReportDetailHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
        </Button>

        <div className="flex items-center gap-2">
          <Badge variant={isPreviewMode ? 'secondary' : 'default'}>
            {isPreviewMode ? 'Preview Mode' : 'Edit Mode'}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleMode}
            className="gap-2"
          >
            {isPreviewMode ? (
              <>
                <Edit className="h-4 w-4" />
                Edit
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Preview
              </>
            )}
          </Button>

          {onExportPdf && (
            <Button variant="outline" size="sm" onClick={onExportPdf} className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          )}

          {onExportHtml && (
            <Button variant="outline" size="sm" onClick={onExportHtml} className="gap-2">
              <FileText className="h-4 w-4" />
              Export HTML
            </Button>
          )}
        </div>
      </div>

      {!isPreviewMode && <ReportHeader title={title} onSave={onSaveTitle} />}
      {isPreviewMode && <h1 className="text-3xl font-bold">{title}</h1>}
    </div>
  );
}



