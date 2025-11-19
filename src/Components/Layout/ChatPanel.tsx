import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  context?: {
    selectedParcel?: string;
    mapView?: string;
    analysis?: string;
  };
}

const ChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your Vienna Building Development Assistant. I can help you analyze building potential, zoning regulations, and development opportunities. How can I assist you today?',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mockResponses = [
    "Based on the parcel you've selected at Stephansplatz 1, the current building has 8 floors but zoning allows up to 12 floors. However, since this is in a historic district, you'll need special permits for height modifications.",
    "The selected property is in Kerngebiet A zoning, which typically allows for commercial and mixed-use development. The Floor Area Ratio of 4.5 suggests good development potential.",
    "I notice you're looking at a property in Vienna's 1st district. This area has strict facade preservation requirements. Any additional floors would likely need to be set back from the street facade.",
    "The building height restriction of 32m and the current 8 floors suggest each floor is about 4m high. Adding 4 more floors would approach the maximum allowed height.",
    "For this historic district location, I recommend consulting with Vienna's Urban Planning Department (MA 21) before proceeding with development plans."
  ];

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: mockResponses[Math.floor(Math.random() * mockResponses.length)],
        timestamp: new Date(),
        context: {
          selectedParcel: 'AT-1010-001-23',
          mapView: 'Vienna 1st District',
          analysis: 'Height potential analysis'
        }
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "Can I add more floors to this building?",
    "What are the zoning restrictions?",
    "How do I get development permits?",
    "What's the maximum building height allowed?"
  ];

  return (
    <div className="h-full bg-panel flex flex-col">
      {/* Panel Header */}
      <div className="p-4 border-b border-panel-border bg-panel-header">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          AI Development Assistant
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Context-aware building analysis
        </p>
      </div>

      {/* Context Indicators */}
      <div className="p-3 border-b border-panel-border bg-panel-header/50">
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Map Context Active
          </Badge>
          <Badge variant="outline" className="text-xs">
            Site: AT-1010-001-23
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`space-y-1 ${message.type === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                    <Card className={`p-3 ${
                      message.type === 'user' 
                        ? 'bg-primary text-white' 
                        : 'bg-white border'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </Card>
                    
                    {message.context && (
                      <div className="flex gap-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {message.context.selectedParcel}
                        </Badge>
                        {message.context.analysis && (
                          <Badge variant="secondary" className="text-xs">
                            {message.context.analysis}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <Card className="p-3 bg-white border">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="p-3 border-b border-panel-border bg-panel-header/30">
          <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
          <div className="space-y-1">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="h-auto p-2 text-xs text-left justify-start w-full"
                onClick={() => setInputMessage(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-panel-border bg-panel-header/30">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Ask about zoning, permits, or building potential..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={isTyping}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputMessage.trim() || isTyping}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          AI assistant with access to Vienna building codes and current map selection
        </p>
      </div>
    </div>
  );
};

export default ChatPanel;