import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import SiteInfoPanel from './SiteInfoPanel';
import MapPanel from './MapPanel';
import ChatPanel from './ChatPanel';

const MainLayout = () => {
  return (
    <div className="h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-panel-border bg-panel-header flex items-center px-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">VB</span>
          </div>
          <div>
            <h1 className="font-semibold text-lg text-foreground">Vienna Building Advisor</h1>
            <p className="text-xs text-muted-foreground">AI-powered development analysis</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="h-[calc(100vh-4rem)]">
        <PanelGroup direction="horizontal">
          {/* Left Panel - Site Information */}
          <Panel defaultSize={25} minSize={20} maxSize={35}>
            <SiteInfoPanel />
          </Panel>
          
          <PanelResizeHandle className="w-2 bg-panel-border hover:bg-primary/20 transition-colors" />
          
          {/* Center Panel - Map */}
          <Panel defaultSize={50} minSize={30}>
            <MapPanel />
          </Panel>
          
          <PanelResizeHandle className="w-2 bg-panel-border hover:bg-primary/20 transition-colors" />
          
          {/* Right Panel - Chat */}
          <Panel defaultSize={25} minSize={20} maxSize={35}>
            <ChatPanel />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default MainLayout;