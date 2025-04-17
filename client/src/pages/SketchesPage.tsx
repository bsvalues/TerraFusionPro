import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppraisal } from '@/contexts/AppraisalContext';
import { Sketch, InsertSketch } from '@shared/schema';

export default function SketchesPage() {
  const { currentReport, sketches, createSketch, updateSketch, deleteSketch } = useAppraisal();
  const [selectedSketch, setSelectedSketch] = useState<Sketch | null>(null);
  const [sketchName, setSketchName] = useState('');
  const [sketchType, setSketchType] = useState('floor_plan');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [sketchData, setSketchData] = useState<any>({
    lines: [],
    currentLine: []
  });
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [penColor, setPenColor] = useState('#000000');
  const [penSize, setPenSize] = useState(2);

  // Sketch type options
  const sketchTypes = [
    { value: 'floor_plan', label: 'Floor Plan' },
    { value: 'site_plan', label: 'Site Plan' },
    { value: 'elevation', label: 'Elevation' },
    { value: 'detail', label: 'Detail' }
  ];

  // Initialize canvas for selected sketch
  useEffect(() => {
    if (selectedSketch && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw saved sketch
      if (selectedSketch.data && selectedSketch.data.lines) {
        drawSketch(ctx, selectedSketch.data.lines);
      }
    }
  }, [selectedSketch]);

  // Draw the sketch from line data
  const drawSketch = (ctx: CanvasRenderingContext2D, lines: any[]) => {
    lines.forEach(line => {
      if (line.points.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(line.points[0].x, line.points[0].y);
      
      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].x, line.points[i].y);
      }
      
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });
  };

  // Handle mouse down for drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    setDrawing(true);
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Start a new line
    setSketchData(prev => ({
      ...prev,
      currentLine: [{
        x,
        y
      }]
    }));
  };

  // Handle mouse move for drawing
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add point to current line
    setSketchData(prev => {
      const newCurrentLine = [...prev.currentLine, { x, y }];
      
      // Draw the line
      if (newCurrentLine.length >= 2) {
        const lastPoint = newCurrentLine[newCurrentLine.length - 2];
        
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : penColor;
        ctx.lineWidth = tool === 'eraser' ? penSize * 3 : penSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
      
      return {
        ...prev,
        currentLine: newCurrentLine
      };
    });
  };

  // Handle mouse up for drawing
  const handleMouseUp = () => {
    if (!drawing) return;
    
    setDrawing(false);
    
    // Add the current line to the lines array
    setSketchData(prev => ({
      lines: [...prev.lines, {
        points: prev.currentLine,
        color: tool === 'eraser' ? '#FFFFFF' : penColor,
        size: tool === 'eraser' ? penSize * 3 : penSize
      }],
      currentLine: []
    }));
  };

  // Handle mouse leave for drawing
  const handleMouseLeave = () => {
    handleMouseUp();
  };

  // Clear the canvas
  const handleClearCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSketchData({ lines: [], currentLine: [] });
  };

  // Save the sketch
  const handleSaveSketch = async () => {
    if (!currentReport || !canvasRef.current) return;
    
    try {
      // If we're updating an existing sketch
      if (selectedSketch) {
        await updateSketch(selectedSketch.id, {
          sketchType,
          data: sketchData
        });
        
        setSelectedSketch({
          ...selectedSketch,
          sketchType,
          data: sketchData,
          updatedAt: new Date()
        });
      } else {
        // Create a new sketch
        const canvas = canvasRef.current;
        const newSketch: InsertSketch = {
          reportId: currentReport.id,
          sketchType,
          data: sketchData
        };
        
        const sketch = await createSketch(newSketch);
        setSelectedSketch(sketch);
        setSketchName('');
      }
    } catch (error) {
      console.error('Error saving sketch:', error);
    }
  };

  // Create a new sketch
  const handleNewSketch = () => {
    setSelectedSketch(null);
    setSketchName('');
    setSketchType('floor_plan');
    setSketchData({ lines: [], currentLine: [] });
    handleClearCanvas();
  };

  if (!currentReport) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-neutral-medium p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">Property Sketches</h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleNewSketch}
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Sketch
          </Button>
          
          <Button 
            size="sm"
            onClick={handleSaveSketch}
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Sketch
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-4 gap-0">
        {/* Sketch list sidebar */}
        <div className="col-span-1 overflow-auto p-4 bg-white border-r border-neutral-medium">
          <div className="mb-4">
            <Input
              placeholder="Search sketches..."
              className="w-full"
            />
          </div>
          
          {sketches.length > 0 ? (
            <div className="space-y-2">
              {sketches.map((sketch) => {
                const sketchTypeObj = sketchTypes.find(t => t.value === sketch.sketchType);
                return (
                  <div 
                    key={sketch.id} 
                    className={`p-3 rounded-md cursor-pointer border
                      ${selectedSketch?.id === sketch.id ? 'border-primary bg-primary/5' : 'border-neutral-medium hover:bg-neutral-light'}`}
                    onClick={() => setSelectedSketch(sketch)}
                  >
                    <div className="font-medium">{sketchTypeObj?.label || sketch.sketchType}</div>
                    <div className="text-xs text-neutral-gray flex justify-between mt-1">
                      <span>
                        Updated: {new Date(sketch.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-4 text-neutral-gray">
              <p>No sketches found</p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2"
                onClick={handleNewSketch}
              >
                Create your first sketch
              </Button>
            </div>
          )}
        </div>

        {/* Sketch canvas */}
        <div className="col-span-3 overflow-auto bg-neutral-lightest flex flex-col">
          <div className="p-4 bg-white border-b border-neutral-medium flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <Label htmlFor="sketch-type" className="sr-only">Sketch Type</Label>
                <Select 
                  value={sketchType}
                  onValueChange={setSketchType}
                >
                  <SelectTrigger id="sketch-type" className="w-40">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {sketchTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex border border-neutral-medium rounded-md overflow-hidden">
                <Button 
                  variant={tool === 'pen' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setTool('pen')}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </Button>
                <Button 
                  variant={tool === 'eraser' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setTool('eraser')}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>

              {tool === 'pen' && (
                <div className="flex items-center space-x-2">
                  <Label htmlFor="pen-color" className="sr-only">Color</Label>
                  <input 
                    type="color" 
                    id="pen-color"
                    value={penColor}
                    onChange={(e) => setPenColor(e.target.value)}
                    className="w-8 h-8 rounded overflow-hidden cursor-pointer"
                  />

                  <Label htmlFor="pen-size" className="sr-only">Size</Label>
                  <Select 
                    value={penSize.toString()}
                    onValueChange={(value) => setPenSize(parseInt(value))}
                  >
                    <SelectTrigger id="pen-size" className="w-20">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Thin</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="4">Thick</SelectItem>
                      <SelectItem value="8">Very Thick</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Button 
              variant="outline"
              size="sm"
              onClick={handleClearCanvas}
            >
              Clear Canvas
            </Button>
          </div>

          <div className="flex-1 p-4 flex items-center justify-center bg-white">
            <div className="border border-neutral-medium shadow-sm rounded-md overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                className="cursor-crosshair"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
