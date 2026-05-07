import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, FileJson, FileText, FileImage } from 'lucide-react';

interface AuditExportMenuProps {
  onExportJSON: () => void;
  onExportCSV: () => void;
  onExportPDF?: () => void;
  disabled?: boolean;
}

export function AuditExportMenu({
  onExportJSON,
  onExportCSV,
  onExportPDF,
  disabled = false
}: AuditExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="border-gray-800"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
        <DropdownMenuItem
          onClick={onExportJSON}
          className="cursor-pointer hover:bg-gray-800"
        >
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onExportCSV}
          className="cursor-pointer hover:bg-gray-800"
        >
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        {onExportPDF && (
          <DropdownMenuItem
            onClick={onExportPDF}
            className="cursor-pointer hover:bg-gray-800"
          >
            <FileImage className="h-4 w-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}