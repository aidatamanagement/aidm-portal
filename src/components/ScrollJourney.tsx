import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { CheckCircle, MapPin, Cloud, Mountain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Simple car image component with shadow
function AnimatedCar({ className = "h-12 w-8", isMoving = false }: { className?: string; isMoving?: boolean }) {
  return (
    <div className="relative">
      {/* Car shadow */}
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-10 h-3 bg-black/20 rounded-full blur-sm"></div>
      
      {/* Car image */}
      <img
        src="/images/car.png"
        alt="Car"
        className={`${className} object-contain block relative z-10 drop-shadow-lg`}
        onError={(e) => {
          console.error('❌ Car image failed to load from /images/car.png');
          const target = e.target as HTMLImageElement;
          target.outerHTML = `<div class="${className} flex items-center justify-center text-2xl bg-blue-500 text-white rounded">🚗</div>`;
        }}
        onLoad={() => {
          console.log('✅ Car image loaded successfully');
        }}
      />
      

      
      {/* Exhaust smoke effect */}
      {isMoving && (
        <motion.div
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.5, 0], 
            opacity: [0, 0.4, 0],
            x: [0, -8, -15]
          }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
        >
          <div className="w-5 h-3 bg-gray-300/40 rounded-full blur-sm"></div>
        </motion.div>
      )}
      
      {/* Tire marks */}
      {isMoving && (
        <div className="absolute -bottom-2 left-1/4 right-1/4">
          <motion.div
            className="flex justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <div className="w-1 h-4 bg-gray-600/20 rounded-full"></div>
            <div className="w-1 h-4 bg-gray-600/20 rounded-full"></div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

interface JourneyPhase {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  items: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

interface ScrollJourneyProps {
  type: 'phases' | 'weeks';
  title: string;
  subtitle: string;
  phases?: JourneyPhase[];
  carStartPosition?: number;
  carEndPosition?: number;
}

const defaultPhases: JourneyPhase[] = [
  {
    id: '1',
    title: 'Phase 1: Strategy & Transformation',
    subtitle: 'Months 1-3',
    description: 'Foundation building and strategic planning for AI implementation.',
    items: [
      'AI Readiness Assessment',
      'Strategic Roadmap Development',
      'Digital Transformation Setup',
      'Executive Training Kickoff'
    ],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: <MapPin className="h-5 w-5 text-blue-600" />
  },
  {
    id: '2',
    title: 'Phase 2: Workflow Automation',
    subtitle: 'Months 4-6',
    description: 'Implementing AI tools and automating key business processes.',
    items: [
      'Workflow Analysis & Automation',
      'Advanced AI Tool Integration',
      'Hands-on Training Sessions',
      'Process Optimization'
    ],
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: <MapPin className="h-5 w-5 text-green-600" />
  },
  {
    id: '3',
    title: 'Phase 3: Custom AI Development',
    subtitle: 'Months 7-9',
    description: 'Building and deploying custom AI agents for your organization.',
    items: [
      'Custom AI Agent Creation',
      'System Integration',
      'Pilot Testing & Validation',
      'Performance Optimization'
    ],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: <MapPin className="h-5 w-5 text-orange-600" />
  },
  {
    id: '4',
    title: 'Phase 4: Full Implementation',
    subtitle: 'Months 10-12',
    description: 'Complete deployment with ongoing support and optimization.',
    items: [
      'Full-Scale Deployment',
      'Continuous Monitoring',
      'Ongoing Support & Training',
      'Success Measurement'
    ],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: <MapPin className="h-5 w-5 text-purple-600" />
  }
];

const trainingWeeks: JourneyPhase[] = [
  {
    id: '1',
    title: 'Weeks 1-3: AI Foundations',
    subtitle: 'Getting Started',
    description: 'Building the fundamental knowledge for AI leadership.',
    items: [
      'AI Fundamentals & Workspace Setup',
      'Prompt Engineering Mastery',
      'Building AI-Powered Tools'
    ],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: <MapPin className="h-5 w-5 text-blue-600" />
  },
  {
    id: '2',
    title: 'Weeks 4-5: Custom GPTs',
    subtitle: 'AI Assistants',
    description: 'Creating personalized AI solutions for your needs.',
    items: [
      'Custom GPT Development',
      'AI Workflow Optimization',
      'Introduction to AI Agents'
    ],
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: <MapPin className="h-5 w-5 text-green-600" />
  },
  {
    id: '3',
    title: 'Weeks 6-7: AI Integration',
    subtitle: 'Real-World Applications',
    description: 'Implementing AI solutions in business operations.',
    items: [
      'Practical AI Applications',
      'Business Integration',
      'Use Case Development'
    ],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: <MapPin className="h-5 w-5 text-orange-600" />
  },
  {
    id: '4',
    title: 'Weeks 8-9: Optimization',
    subtitle: 'System Maintenance',
    description: 'Ensuring long-term success with AI systems.',
    items: [
      'AI Performance Audits',
      'System Optimization',
      'Continuous Improvement'
    ],
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    icon: <MapPin className="h-5 w-5 text-cyan-600" />
  },
  {
    id: '5',
    title: 'Week 10: Compliance & SOPs',
    subtitle: 'Governance',
    description: 'Establishing AI governance and compliance frameworks.',
    items: [
      'Custom AI SOPs',
      'Compliance Frameworks',
      'Data Governance'
    ],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: <MapPin className="h-5 w-5 text-purple-600" />
  }
];

function PhaseCard({ phase, index }: { phase: JourneyPhase; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative"
    >
      <Card className={`${phase.borderColor} border-2 hover:shadow-lg transition-all duration-300 group`}>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`w-12 h-12 ${phase.bgColor} rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
              {phase.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <Badge variant="outline" className={`${phase.color} ${phase.borderColor}`}>
                  {phase.subtitle}
                </Badge>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                {phase.title}
              </h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {phase.description}
              </p>
              <div className="space-y-2">
                {phase.items.map((item, itemIndex) => (
                  <motion.div
                    key={itemIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, delay: index * 0.1 + itemIndex * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className={`h-4 w-4 ${phase.color} flex-shrink-0`} />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function BackgroundElements() {
  return null; // Clean background without clouds and mountains
}

export default function ScrollJourney({ 
  type = 'phases', 
  title = "Your AI Journey", 
  subtitle = "Watch your progress unfold",
  phases,
  carStartPosition,
  carEndPosition
}: ScrollJourneyProps) {
  const containerRef = useRef(null);
  const roadRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const journeyPhases = phases || (type === 'weeks' ? trainingWeeks : defaultPhases);
  
  // Calculate exact start and end positions based on content or use custom values
  const defaultStartPosition = 48; // Start exactly at the START marker (12px from top + marker height)
  const baseSpacing = journeyPhases.length >= 5 ? 300 : 240;
  const phaseSpacing = baseSpacing; // Each phase takes about 240-300px depending on content
  const finishLineOffset = 150; // Distance to finish line after last phase
  const defaultEndPosition = defaultStartPosition + (journeyPhases.length * phaseSpacing) + finishLineOffset;
  
  // Use custom positions if provided, otherwise use calculated defaults
  const startPosition = carStartPosition ?? defaultStartPosition;
  const endPosition = carEndPosition ?? defaultEndPosition;
  
  // Calculate car position based on scroll progress
  const carY = useTransform(
    scrollYProgress,
    [0, 1],
    [startPosition, endPosition]
  );


  
  // Detect if car is moving based on scroll velocity
  const [isMoving, setIsMoving] = React.useState(false);
  
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const unsubscribe = scrollYProgress.on("change", () => {
      setIsMoving(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsMoving(false), 100);
    });
    
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [scrollYProgress]);

  return (
    <div className="relative py-16 min-h-screen">
      <BackgroundElements />
      
      {/* Header */}
      <div className="text-center mb-16 relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-foreground mb-4"
        >
          {title}
        </motion.h2>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: 96 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-1 bg-primary mx-auto mb-4"
        />
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          {subtitle}
        </motion.p>
      </div>

      <div ref={containerRef} className="relative max-w-6xl mx-auto px-4">
        {/* Road/Timeline */}
        <div ref={roadRef} className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 hidden md:block">
          {/* Road surface */}
          <div className="w-20 h-full bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800 relative shadow-lg">
            {/* Road edges - white lines */}
            <div className="absolute left-0 w-0.5 h-full bg-white opacity-90"></div>
            <div className="absolute right-0 w-0.5 h-full bg-white opacity-90"></div>
            
            {/* Center dashed yellow line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full">
              <div 
                className="h-full"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    to bottom,
                    #facc15 0px,
                    #facc15 20px,
                    transparent 20px,
                    transparent 35px
                  )`
                }}
              ></div>
            </div>
            
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 1px,
                rgba(255,255,255,0.1) 1px,
                rgba(255,255,255,0.1) 2px
              )`
            }}></div>
          </div>
          
          {/* Start marker */}
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
              START
            </div>
          </div>
          
          {/* Animated Car */}
          <motion.div
            style={{ y: carY }}
            className="absolute left-1/2 transform -translate-x-1/2 top-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="relative flex items-center justify-center">
              <AnimatedCar className="h-14 w-10" isMoving={isMoving} />
            </div>

          </motion.div>
        </div>

        {/* Phase Cards */}
        <div className="relative z-10">
          {journeyPhases.map((phase, index) => (
            <div
              key={phase.id}
              className="relative mb-8 md:mb-12"
            >
              {/* Desktop Layout */}
              <div className="hidden md:block">
                <div className={`flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-12' : 'pl-12'}`}>
                    <PhaseCard phase={phase} index={index} />
                  </div>
                </div>
                
                {/* Waypoint */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={`w-6 h-6 ${phase.bgColor} border-4 border-white rounded-full shadow-lg`}
                  />
                </div>

                {/* Connector line to waypoint */}
                <div className={`absolute top-1/2 transform -translate-y-1/2 ${
                  index % 2 === 0 
                    ? 'right-1/2 mr-6 w-12'
                    : 'left-1/2 ml-6 w-12'
                } h-0.5 ${phase.bgColor} opacity-50`} />

                {/* Car Showcase Card for 4th Phase (index 3) */}
                {index === 3 && (
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-8">
                  </div>
                )}
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="flex flex-col items-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className={`w-6 h-6 ${phase.bgColor} border-4 border-white rounded-full shadow-lg`}
                  />
                  <div className="w-full">
                    <PhaseCard phase={phase} index={index} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Finish Line */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mt-24 relative z-10"
        >
          {/* Finish marker on road */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 -top-16 z-30">
            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              FINISH
            </div>
          </div>
          
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-primary to-primary/80 text-white px-8 py-4 rounded-full shadow-lg">
            <span className="text-lg font-semibold">🏁 Journey Complete!</span>
          </div>
          
          {/* Debug info - remove in production */}
          <motion.div 
            className="mt-4 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
          </motion.div>
        </motion.div>
      </div>


    </div>
  );
} 