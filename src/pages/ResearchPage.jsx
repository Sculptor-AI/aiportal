import React, { useState, useEffect } from 'react';
import { Search, Clock, Download, Trash2, FileText, Loader } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { API_URL } from '../config/api';

const ResearchPage = () => {
  const [researchTopic, setResearchTopic] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [agentStatuses, setAgentStatuses] = useState([]);
  const [savedReports, setSavedReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [error, setError] = useState(null);

  // Load saved reports from localStorage on mount
  useEffect(() => {
    const loadReports = () => {
      try {
        const stored = localStorage.getItem('deepResearchReports');
        if (stored) {
          setSavedReports(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load saved reports:', err);
      }
    };
    loadReports();
  }, []);

  // Save reports to localStorage whenever they change
  const saveReportsToStorage = (reports) => {
    try {
      localStorage.setItem('deepResearchReports', JSON.stringify(reports));
      setSavedReports(reports);
    } catch (err) {
      console.error('Failed to save reports:', err);
    }
  };

  const startResearch = async () => {
    if (!researchTopic.trim()) return;

    setIsResearching(true);
    setError(null);
    setProgress(0);
    setProgressStatus('Starting research...');
    setAgentStatuses([]);

    try {
      // Start the research task
      const response = await fetch(`${API_URL}/api/research/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ researchTopic })
      });

      if (!response.ok) {
        throw new Error(`Failed to start research: ${response.statusText}`);
      }

      const { taskId } = await response.json();
      setCurrentTaskId(taskId);

      // Connect to SSE for progress updates
      const eventSource = new EventSource(`${API_URL}/api/research/stream/${taskId}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.status === 'connected') {
          setProgressStatus('Connected to research engine...');
        } else if (data.status === 'error') {
          setError(data.message || 'Research failed');
          setIsResearching(false);
          eventSource.close();
        } else if (data.status === 'completed') {
          // Save the completed report
          const newReport = {
            id: taskId,
            topic: researchTopic,
            report: data.finalReport,
            sources: data.sources || [],
            timestamp: new Date().toISOString()
          };
          
          const updatedReports = [newReport, ...savedReports];
          saveReportsToStorage(updatedReports);
          setSelectedReport(newReport);
          setIsResearching(false);
          setProgressStatus('Research completed!');
          eventSource.close();
        } else {
          // Update progress
          setProgress(data.progress || 0);
          setProgressStatus(data.status || 'Researching...');
          
          if (data.agentStatuses) {
            setAgentStatuses(data.agentStatuses);
          }
        }
      };

      eventSource.onerror = () => {
        setError('Connection lost. Please try again.');
        setIsResearching(false);
        eventSource.close();
      };

    } catch (err) {
      setError(err.message);
      setIsResearching(false);
    }
  };

  const deleteReport = (reportId) => {
    const updatedReports = savedReports.filter(report => report.id !== reportId);
    saveReportsToStorage(updatedReports);
    if (selectedReport?.id === reportId) {
      setSelectedReport(null);
    }
  };

  const downloadReport = (report) => {
    const content = `# Research Report: ${report.topic}\n\nGenerated on: ${format(new Date(report.timestamp), 'PPP')}\n\n${report.report}\n\n## Sources\n\n${report.sources.map(s => `- ${s}`).join('\n')}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-${report.topic.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Deep Research</h1>

        {/* Research Input Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Start New Research</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={researchTopic}
              onChange={(e) => setResearchTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isResearching && startResearch()}
              placeholder="Enter your research topic..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isResearching}
            />
            <button
              onClick={startResearch}
              disabled={isResearching || !researchTopic.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isResearching ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Research
                </>
              )}
            </button>
          </div>

          {/* Progress Section */}
          {(isResearching || progress > 0) && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{progressStatus}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              {/* Agent Status */}
              {agentStatuses.length > 0 && (
                <div className="mt-4 space-y-2">
                  {agentStatuses.map((agent, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium">{agent.name}:</span>{' '}
                      <span className="text-gray-600">{agent.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Saved Reports List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Saved Reports</h2>
              {savedReports.length === 0 ? (
                <p className="text-gray-500">No saved reports yet</p>
              ) : (
                <div className="space-y-3">
                  {savedReports.map((report) => (
                    <div
                      key={report.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedReport?.id === report.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 line-clamp-2">
                            {report.topic}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {format(new Date(report.timestamp), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteReport(report.id);
                          }}
                          className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Report Display */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedReport.topic}
                  </h2>
                  <button
                    onClick={() => downloadReport(selectedReport)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Download report"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown>{selectedReport.report}</ReactMarkdown>
                </div>

                {selectedReport.sources && selectedReport.sources.length > 0 && (
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-3">Sources</h3>
                    <ul className="space-y-2">
                      {selectedReport.sources.map((source, idx) => (
                        <li key={idx} className="text-sm text-gray-600">
                          {source}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a report to view or start a new research</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchPage; 