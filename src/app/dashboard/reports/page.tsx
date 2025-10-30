"use client";

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, BarChart, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { summarizeUploadedReport } from '@/ai/flows/summarize-uploaded-report';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type Report = {
  id: string;
  name: string;
  uploadDate: string;
  imageUrl: string;
  imageHint: string;
  file?: File;
  dataUri?: string;
};

const initialReports: Report[] = PlaceHolderImages.filter(img => img.id.startsWith('report-')).map((img, i) => ({
  id: img.id,
  name: `Blood_Test_Results_0${i + 1}.pdf`,
  uploadDate: `2023-10-${26-i}`,
  imageUrl: img.imageUrl,
  imageHint: img.imageHint,
}));

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const newReport: Report = {
          id: `report-${reports.length + 1}`,
          name: file.name,
          uploadDate: new Date().toISOString().split('T')[0],
          imageUrl: URL.createObjectURL(file), // temp URL for preview
          imageHint: 'uploaded document',
          file: file,
          dataUri: e.target?.result as string,
        };
        setReports(prev => [newReport, ...prev]);
        toast({ title: 'Success', description: 'Report uploaded successfully.' });
      };
      reader.readAsDataURL(file);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };
  
  const handleAnalyze = async (report: Report) => {
    if (!report.dataUri) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot analyze this report. File data is missing.' });
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setIsModalOpen(true);
    try {
      const result = await summarizeUploadedReport({ fileDataUri: report.dataUri });
      setAnalysisResult(result.summary);
    } catch(error) {
      console.error(error);
      setAnalysisResult('Failed to analyze the report. Please try again.');
      toast({ variant: 'destructive', title: 'Analysis Failed', description: 'Could not get summary from AI.' });
    } finally {
      setIsAnalyzing(false);
    }
  };


  return (
    <div className="space-y-6">
      <Card
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`border-2 border-dashed ${isDragging ? 'border-primary bg-primary/10' : ''}`}
      >
        <label htmlFor="file-upload" className="cursor-pointer">
          <CardContent className="p-6 flex flex-col items-center justify-center space-y-2 text-center">
            <UploadCloud className="w-12 h-12 text-muted-foreground" />
            <p className="text-lg font-semibold">Drag & drop files here, or click to select</p>
            <p className="text-muted-foreground">PDF or Image files are supported</p>
            <input id="file-upload" type="file" className="hidden" onChange={(e) => handleFileChange(e.target.files)} accept=".pdf,image/*"/>
          </CardContent>
        </label>
      </Card>
      <div>
        <h2 className="text-2xl font-semibold mb-4">Uploaded Reports</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden">
              <CardHeader className="p-0">
                <Image
                  src={report.imageUrl}
                  alt={report.name}
                  width={400}
                  height={300}
                  className="object-cover w-full h-48"
                  data-ai-hint={report.imageHint}
                />
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="truncate">{report.name}</CardTitle>
                <CardDescription>Uploaded on {report.uploadDate}</CardDescription>
              </CardContent>
              <CardFooter className="p-4 flex gap-2">
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 h-4 w-4" /> View
                </Button>
                <Button className="w-full" onClick={() => handleAnalyze(report)} disabled={!report.dataUri}>
                   <BarChart className="mr-2 h-4 w-4" /> Analyze
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Report Analysis</DialogTitle>
            <DialogDescription>
              AI-powered summary of your report.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {isAnalyzing ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">
                {analysisResult}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
