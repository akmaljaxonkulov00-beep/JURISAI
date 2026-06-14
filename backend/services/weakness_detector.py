"""
Weakness Detector Service - Advanced legal argument weakness analysis
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import re
import json
from dataclasses import dataclass, field
from enum import Enum

from core.logging import get_logger, performance_logger
from core.error_handling import handle_errors, JurisAIException, BusinessLogicError
from services.ai_service import AIService, AIRequest, AIModelType

logger = get_logger(__name__)

class WeaknessType(Enum):
    """Types of legal argument weaknesses"""
    LOGICAL_FALLACY = "logical_fallacy"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    IRRELEVANT_ARGUMENT = "irrelevant_argument"
    LEGAL_MISAPPLICATION = "legal_misapplication"
    STRUCTURAL_ISSUE = "structural_issue"
    EMOTIONAL_REASONING = "emotional_reasoning"
    MISSING_PRECEDENT = "missing_precedent"
    UNCLEAR_CONCLUSION = "unclear_conclusion"

class SeverityLevel(Enum):
    """Severity levels for weaknesses"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ArgumentType(Enum):
    """Types of legal arguments"""
    IRAC_ANALYSIS = "irac_analysis"
    LEGAL_BRIEF = "legal_brief"
    COURT_ARGUMENT = "court_argument"
    CONTRACT_CLAIM = "contract_claim"
    TORT_CLAIM = "tort_claim"
    APPELLATE_BRIEF = "appellate_brief"

@dataclass
class Weakness:
    """Legal argument weakness structure"""
    type: WeaknessType
    severity: SeverityLevel
    description: str
    location: str  # Text location where weakness occurs
    suggestion: str  # How to fix the weakness
    confidence: float  # Confidence in weakness detection
    impact_score: float  # Impact on overall argument strength

@dataclass
class WeaknessAnalysisResult:
    """Complete weakness analysis result"""
    argument_text: str
    argument_type: ArgumentType
    weaknesses: List[Weakness]
    overall_score: float  # 0-100
    strength_areas: List[str]
    improvement_recommendations: List[str]
    detailed_feedback: str
    processing_time: float
    timestamp: datetime = field(default_factory=datetime.utcnow)

class WeaknessDetectorService:
    """Advanced weakness detector service with AI integration"""
    
    def __init__(self, ai_service: Optional[AIService] = None):
        self.logger = get_logger(self.__class__.__name__)
        self.ai_service = ai_service or AIService()
        self.weakness_patterns = self._initialize_weakness_patterns()
        self.severity_weights = self._initialize_severity_weights()
        self.analysis_history: List[Dict[str, Any]] = []
        
    def _initialize_weakness_patterns(self) -> Dict[WeaknessType, Dict[str, Any]]:
        """Initialize weakness detection patterns"""
        return {
            WeaknessType.LOGICAL_FALLACY: {
                "patterns": [
                    r"obviously\s+true",
                    r"clearly\s+evident",
                    r"everyone\s+knows",
                    r"it\s+goes\s+without\s+saying",
                    r"common\s+sense\s+tells\s+us"
                ],
                "keywords": ["obviously", "clearly", "everyone", "naturally"],
                "description": "Argument relies on assumptions rather than evidence"
            },
            WeaknessType.INSUFFICIENT_EVIDENCE: {
                "patterns": [
                    r"without\s+any\s+evidence",
                    r"no\s+proof\s+provided",
                    r"lacks\s+supporting\s+facts"
                ],
                "keywords": ["believe", "think", "feel", "assume"],
                "description": "Argument lacks sufficient evidentiary support"
            },
            WeaknessType.IRRELEVANT_ARGUMENT: {
                "patterns": [
                    r"however\s+this\s+is\s+unrelated",
                    r"while\s+interesting\s+this\s+doesn't\s+apply"
                ],
                "keywords": ["however", "nevertheless", "regardless"],
                "description": "Argument introduces irrelevant information"
            },
            WeaknessType.LEGAL_MISAPPLICATION: {
                "patterns": [
                    r"applies\s+incorrectly",
                    r"misinterprets\s+the\s+law"
                ],
                "keywords": ["wrong", "incorrect", "misapplied"],
                "description": "Legal principles are misapplied or misinterpreted"
            },
            WeaknessType.STRUCTURAL_ISSUE: {
                "patterns": [
                    r"lacks\s+clear\s+structure",
                    r"disorganized\s+presentation"
                ],
                "keywords": ["disorganized", "unclear", "confusing"],
                "description": "Argument lacks proper logical structure"
            },
            WeaknessType.EMOTIONAL_REASONING: {
                "patterns": [
                    r"obviously\s+unfair",
                    r"clearly\s+wrong",
                    r"terribly\s+unjust"
                ],
                "keywords": ["unfair", "wrong", "terrible", "awful"],
                "description": "Argument relies on emotional appeals rather than legal reasoning"
            },
            WeaknessType.MISSING_PRECEDENT: {
                "patterns": [
                    r"no\s+case\s+law\s+cited",
                    r"lacks\s+precedent"
                ],
                "keywords": ["precedent", "case law", "authority"],
                "description": "Argument fails to cite relevant legal precedents"
            },
            WeaknessType.UNCLEAR_CONCLUSION: {
                "patterns": [
                    r"unclear\s+conclusion",
                    r"vague\s+outcome"
                ],
                "keywords": ["unclear", "vague", "ambiguous"],
                "description": "Conclusion is unclear or ambiguous"
            }
        }
    
    def _initialize_severity_weights(self) -> Dict[SeverityLevel, float]:
        """Initialize severity weights for scoring"""
        return {
            SeverityLevel.LOW: 0.1,
            SeverityLevel.MEDIUM: 0.3,
            SeverityLevel.HIGH: 0.6,
            SeverityLevel.CRITICAL: 1.0
        }
    
    @performance_logger
    @handle_errors(log_errors=True, reraise=True)
    async def analyze_weaknesses(self, argument_text: str, argument_type: ArgumentType,
                                user_id: Optional[str] = None) -> WeaknessAnalysisResult:
        """
        Analyze legal argument for weaknesses
        
        Args:
            argument_text (str): Legal argument text to analyze
            argument_type (ArgumentType): Type of legal argument
            user_id (Optional[str]): User ID requesting analysis
            
        Returns:
            WeaknessAnalysisResult: Complete weakness analysis
        """
        start_time = datetime.utcnow()
        
        try:
            # Preprocess argument text
            processed_text = self._preprocess_argument(argument_text)
            
            # Detect weaknesses using pattern matching
            pattern_weaknesses = self._detect_pattern_weaknesses(processed_text)
            
            # Use AI for advanced weakness detection
            ai_weaknesses = await self._ai_weakness_detection(processed_text, argument_type)
            
            # Combine and deduplicate weaknesses
            all_weaknesses = self._combine_weaknesses(pattern_weaknesses, ai_weaknesses)
            
            # Calculate overall score
            overall_score = self._calculate_overall_score(all_weaknesses)
            
            # Identify strength areas
            strength_areas = self._identify_strength_areas(processed_text, all_weaknesses)
            
            # Generate improvement recommendations
            recommendations = self._generate_recommendations(all_weaknesses, argument_type)
            
            # Generate detailed feedback
            detailed_feedback = await self._generate_detailed_feedback(
                processed_text, all_weaknesses, overall_score, argument_type
            )
            
            # Calculate processing time
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Create result
            result = WeaknessAnalysisResult(
                argument_text=argument_text,
                argument_type=argument_type,
                weaknesses=all_weaknesses,
                overall_score=overall_score,
                strength_areas=strength_areas,
                improvement_recommendations=recommendations,
                detailed_feedback=detailed_feedback,
                processing_time=processing_time
            )
            
            # Store analysis history
            self._store_analysis_history(user_id, argument_type, result)
            
            self.logger.info(f"Weakness analysis completed", extra={
                "argument_type": argument_type.value,
                "weakness_count": len(all_weaknesses),
                "overall_score": overall_score,
                "processing_time": processing_time
            })
            
            return result
            
        except Exception as e:
            self.logger.error(f"Weakness analysis failed: {e}")
            raise BusinessLogicError(
                f"Failed to analyze weaknesses: {str(e)}",
                business_rule="WEAKNESS_ANALYSIS"
            )
    
    def _preprocess_argument(self, argument_text: str) -> str:
        """Preprocess argument text for analysis"""
        # Clean and normalize text
        processed = argument_text.strip()
        
        # Remove extra whitespace
        processed = re.sub(r'\s+', ' ', processed)
        
        # Ensure proper sentence structure
        processed = re.sub(r'([.!?])\s*([a-z])', r'\1 \2', processed)
        
        # Add paragraph markers for better analysis
        processed = re.sub(r'\n\s*\n', ' [PARAGRAPH] ', processed)
        
        return processed
    
    def _detect_pattern_weaknesses(self, text: str) -> List[Weakness]:
        """Detect weaknesses using pattern matching"""
        weaknesses = []
        
        for weakness_type, pattern_data in self.weakness_patterns.items():
            # Check for pattern matches
            for pattern in pattern_data["patterns"]:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    # Determine severity based on context
                    severity = self._determine_pattern_severity(match.group(), weakness_type)
                    
                    # Create weakness
                    weakness = Weakness(
                        type=weakness_type,
                        severity=severity,
                        description=pattern_data["description"],
                        location=self._get_location_context(text, match.start()),
                        suggestion=self._generate_pattern_suggestion(weakness_type),
                        confidence=0.7,  # Pattern matching confidence
                        impact_score=self.severity_weights[severity]
                    )
                    weaknesses.append(weakness)
            
            # Check for keyword matches
            for keyword in pattern_data["keywords"]:
                if keyword.lower() in text.lower():
                    # Count occurrences
                    occurrences = len(re.findall(rf'\b{re.escape(keyword)}\b', text, re.IGNORECASE))
                    if occurrences > 2:  # Threshold for keyword weakness
                        severity = self._determine_keyword_severity(keyword, weakness_type)
                        
                        weakness = Weakness(
                            type=weakness_type,
                            severity=severity,
                            description=pattern_data["description"],
                            location=f"Multiple occurrences of '{keyword}'",
                            suggestion=self._generate_keyword_suggestion(keyword, weakness_type),
                            confidence=0.6,
                            impact_score=self.severity_weights[severity]
                        )
                        weaknesses.append(weakness)
        
        return weaknesses
    
    async def _ai_weakness_detection(self, text: str, argument_type: ArgumentType) -> List[Weakness]:
        """Use AI for advanced weakness detection"""
        prompt = f"""
Analyze this legal argument for weaknesses:

Argument Type: {argument_type.value}
Argument Text: {text}

Identify and categorize weaknesses in these areas:
1. Logical fallacies
2. Insufficient evidence
3. Irrelevant arguments
4. Legal misapplication
5. Structural issues
6. Emotional reasoning
7. Missing precedents
8. Unclear conclusions

For each weakness identified, provide:
- Type of weakness
- Severity (low/medium/high/critical)
- Description
- Location in text (quote or description)
- Suggestion for improvement
- Confidence level (0-1)

Format as JSON array of weakness objects.
"""
        
        ai_request = AIRequest(
            model_type=AIModelType.WEAKNESS_DETECTION,
            input_text=prompt,
            temperature=0.3,
            max_tokens=1000,
            user_id="weakness_detector"
        )
        
        response = await self.ai_service.process_request(ai_request)
        
        # Parse AI response
        try:
            ai_weaknesses = []
            weaknesses_data = json.loads(response.response_text)
            
            for weakness_data in weaknesses_data:
                try:
                    weakness = Weakness(
                        type=WeaknessType(weakness_data.get("type", "logical_fallacy")),
                        severity=SeverityLevel(weakness_data.get("severity", "medium")),
                        description=weakness_data.get("description", ""),
                        location=weakness_data.get("location", ""),
                        suggestion=weakness_data.get("suggestion", ""),
                        confidence=float(weakness_data.get("confidence", 0.5)),
                        impact_score=self.severity_weights.get(
                            SeverityLevel(weakness_data.get("severity", "medium")), 0.3
                        )
                    )
                    ai_weaknesses.append(weakness)
                except (ValueError, KeyError) as e:
                    self.logger.warning(f"Failed to parse weakness data: {e}")
                    continue
            
            return ai_weaknesses
            
        except json.JSONDecodeError as e:
            self.logger.warning(f"Failed to parse AI weakness response: {e}")
            return []
    
    def _combine_weaknesses(self, pattern_weaknesses: List[Weakness], 
                           ai_weaknesses: List[Weakness]) -> List[Weakness]:
        """Combine and deduplicate weaknesses"""
        all_weaknesses = pattern_weaknesses + ai_weaknesses
        
        # Deduplicate by type and location
        unique_weaknesses = []
        seen_combinations = set()
        
        for weakness in all_weaknesses:
            combination = (weakness.type.value, weakness.location)
            if combination not in seen_combinations:
                unique_weaknesses.append(weakness)
                seen_combinations.add(combination)
        
        # Sort by impact score (highest first)
        unique_weaknesses.sort(key=lambda w: w.impact_score, reverse=True)
        
        return unique_weaknesses
    
    def _determine_pattern_severity(self, match_text: str, weakness_type: WeaknessType) -> SeverityLevel:
        """Determine severity based on pattern match"""
        # Context-based severity determination
        if weakness_type in [WeaknessType.LOGICAL_FALLACY, WeaknessType.EMOTIONAL_REASONING]:
            return SeverityLevel.HIGH
        elif weakness_type in [WeaknessType.LEGAL_MISAPPLICATION]:
            return SeverityLevel.CRITICAL
        elif weakness_type in [WeaknessType.STRUCTURAL_ISSUE, WeaknessType.UNCLEAR_CONCLUSION]:
            return SeverityLevel.MEDIUM
        else:
            return SeverityLevel.LOW
    
    def _determine_keyword_severity(self, keyword: str, weakness_type: WeaknessType) -> SeverityLevel:
        """Determine severity based on keyword usage"""
        if weakness_type == WeaknessType.EMOTIONAL_REASONING:
            return SeverityLevel.MEDIUM
        elif weakness_type == WeaknessType.INSUFFICIENT_EVIDENCE:
            return SeverityLevel.HIGH
        else:
            return SeverityLevel.LOW
    
    def _get_location_context(self, text: str, position: int) -> str:
        """Get context around weakness location"""
        # Get 50 characters before and after the position
        start = max(0, position - 50)
        end = min(len(text), position + 50)
        
        context = text[start:end]
        
        # Add ellipsis if truncated
        if start > 0:
            context = "..." + context
        if end < len(text):
            context = context + "..."
        
        return context.strip()
    
    def _generate_pattern_suggestion(self, weakness_type: WeaknessType) -> str:
        """Generate suggestion for pattern-based weakness"""
        suggestions = {
            WeaknessType.LOGICAL_FALLACY: "Replace assumptions with evidence-based reasoning",
            WeaknessType.INSUFFICIENT_EVIDENCE: "Provide specific evidence and supporting facts",
            WeaknessType.IRRELEVANT_ARGUMENT: "Focus on directly relevant legal issues",
            WeaknessType.LEGAL_MISAPPLICATION: "Review and correctly apply relevant legal principles",
            WeaknessType.STRUCTURAL_ISSUE: "Reorganize argument with clear logical flow",
            WeaknessType.EMOTIONAL_REASONING: "Replace emotional language with legal reasoning",
            WeaknessType.MISSING_PRECEDENT: "Cite relevant case law and legal precedents",
            WeaknessType.UNCLEAR_CONCLUSION: "State conclusion clearly and specifically"
        }
        
        return suggestions.get(weakness_type, "Review and strengthen this area of the argument")
    
    def _generate_keyword_suggestion(self, keyword: str, weakness_type: WeaknessType) -> str:
        """Generate suggestion for keyword-based weakness"""
        if weakness_type == WeaknessType.EMOTIONAL_REASONING:
            return f"Replace emotional language like '{keyword}' with objective legal analysis"
        elif weakness_type == WeaknessType.INSUFFICIENT_EVIDENCE:
            return f"Support claims with evidence instead of using '{keyword}'"
        else:
            return f"Review usage of '{keyword}' and provide more specific legal reasoning"
    
    def _calculate_overall_score(self, weaknesses: List[Weakness]) -> float:
        """Calculate overall argument strength score"""
        if not weaknesses:
            return 100.0
        
        # Calculate total impact
        total_impact = sum(w.impact_score for w in weaknesses)
        
        # Base score starts at 100, subtract impact
        base_score = 100.0
        
        # Apply impact deductions
        score_deduction = total_impact * 20  # Scale impact to percentage
        
        overall_score = max(0, base_score - score_deduction)
        
        return round(overall_score, 1)
    
    def _identify_strength_areas(self, text: str, weaknesses: List[Weakness]) -> List[str]:
        """Identify areas of strength in the argument"""
        strengths = []
        
        # Check for legal citations
        if re.search(r'Article\s+\d+|Art\.\s*\d+|Section\s+\d+', text, re.IGNORECASE):
            strengths.append("Good use of legal citations")
        
        # Check for logical structure
        if re.search(r'(therefore|because|since|thus|consequently)', text, re.IGNORECASE):
            strengths.append("Logical reasoning structure")
        
        # Check for evidence
        if re.search(r'(evidence|proof|facts|documentation)', text, re.IGNORECASE):
            strengths.append("Evidence-based arguments")
        
        # Check for professional tone
        if not re.search(r'(obviously|clearly|everyone)', text, re.IGNORECASE):
            strengths.append("Professional and objective tone")
        
        # Check length and detail
        if len(text) > 500:
            strengths.append("Detailed and comprehensive analysis")
        
        # If few weaknesses, add general strength
        if len(weaknesses) <= 2:
            strengths.append("Overall strong legal argument")
        
        return strengths
    
    def _generate_recommendations(self, weaknesses: List[Weakness], argument_type: ArgumentType) -> List[str]:
        """Generate improvement recommendations"""
        recommendations = []
        
        # Group weaknesses by type
        weakness_types = {}
        for weakness in weaknesses:
            if weakness.type not in weakness_types:
                weakness_types[weakness.type] = []
            weakness_types[weakness.type].append(weakness)
        
        # Generate recommendations for each weakness type
        for weakness_type, type_weaknesses in weakness_types.items():
            if weakness_type == WeaknessType.LOGICAL_FALLACY:
                recommendations.append("Review logical structure and eliminate assumptions")
            elif weakness_type == WeaknessType.INSUFFICIENT_EVIDENCE:
                recommendations.append("Strengthen arguments with specific evidence and facts")
            elif weakness_type == WeaknessType.IRRELEVANT_ARGUMENT:
                recommendations.append("Focus argument on directly relevant legal issues")
            elif weakness_type == WeaknessType.LEGAL_MISAPPLICATION:
                recommendations.append("Ensure correct application of legal principles")
            elif weakness_type == WeaknessType.STRUCTURAL_ISSUE:
                recommendations.append("Improve argument organization and flow")
            elif weakness_type == WeaknessType.EMOTIONAL_REASONING:
                recommendations.append("Replace emotional appeals with legal reasoning")
            elif weakness_type == WeaknessType.MISSING_PRECEDENT:
                recommendations.append("Include relevant case law and precedents")
            elif weakness_type == WeaknessType.UNCLEAR_CONCLUSION:
                recommendations.append("State conclusion clearly and specifically")
        
        # Add general recommendations based on argument type
        if argument_type == ArgumentType.IRAC_ANALYSIS:
            recommendations.append("Ensure each IRAC component is well-developed")
        elif argument_type == ArgumentType.LEGAL_BRIEF:
            recommendations.append("Strengthen legal authority and precedent citations")
        elif argument_type == ArgumentType.COURT_ARGUMENT:
            recommendations.append("Focus on persuasive legal reasoning")
        
        # Remove duplicates and limit to top recommendations
        unique_recommendations = list(set(recommendations))
        return unique_recommendations[:5]  # Top 5 recommendations
    
    async def _generate_detailed_feedback(self, text: str, weaknesses: List[Weakness], 
                                        overall_score: float, argument_type: ArgumentType) -> str:
        """Generate detailed feedback using AI"""
        weakness_summary = "\n".join([
            f"- {w.type.value}: {w.description} (Severity: {w.severity.value})"
            for w in weaknesses[:5]  # Top 5 weaknesses
        ])
        
        prompt = f"""
Generate detailed feedback for a legal argument analysis:

Argument Type: {argument_type.value}
Overall Score: {overall_score}/100
Weaknesses Found:
{weakness_summary}

Provide comprehensive feedback including:
1. Overall assessment of argument quality
2. Specific analysis of identified weaknesses
3. Recognition of argument strengths
4. Actionable improvement suggestions
5. Professional tone suitable for legal education

Format as a detailed feedback report.
"""
        
        ai_request = AIRequest(
            model_type=AIModelType.WEAKNESS_DETECTION,
            input_text=prompt,
            temperature=0.4,
            max_tokens=800,
            user_id="weakness_detector"
        )
        
        response = await self.ai_service.process_request(ai_request)
        return response.response_text.strip()
    
    def _store_analysis_history(self, user_id: Optional[str], argument_type: ArgumentType, 
                              result: WeaknessAnalysisResult):
        """Store analysis in history"""
        history_entry = {
            "timestamp": result.timestamp.isoformat(),
            "user_id": user_id,
            "argument_type": argument_type.value,
            "overall_score": result.overall_score,
            "weakness_count": len(result.weaknesses),
            "processing_time": result.processing_time,
            "argument_length": len(result.argument_text)
        }
        
        self.analysis_history.append(history_entry)
        
        # Keep only last 1000 analyses
        if len(self.analysis_history) > 1000:
            self.analysis_history = self.analysis_history[-1000:]
    
    @performance_logger
    @handle_errors(log_errors=True, reraise=True)
    async def batch_analyze(self, arguments: List[Tuple[str, ArgumentType]], 
                           user_id: Optional[str] = None) -> List[WeaknessAnalysisResult]:
        """
        Analyze multiple arguments in batch
        
        Args:
            arguments (List[Tuple[str, ArgumentType]]): List of (text, type) tuples
            user_id (Optional[str]): User ID requesting analysis
            
        Returns:
            List[WeaknessAnalysisResult]: List of analysis results
        """
        results = []
        
        # Analyze arguments concurrently
        tasks = [
            self.analyze_weaknesses(text, arg_type, user_id)
            for text, arg_type in arguments
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions
        valid_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                self.logger.error(f"Batch analysis failed for argument {i}: {result}")
            else:
                valid_results.append(result)
        
        return valid_results
    
    def get_analysis_history(self, user_id: Optional[str] = None,
                           argument_type: Optional[ArgumentType] = None,
                           limit: int = 50) -> List[Dict[str, Any]]:
        """Get weakness analysis history"""
        history = self.analysis_history
        
        # Filter by user ID
        if user_id:
            history = [entry for entry in history if entry.get("user_id") == user_id]
        
        # Filter by argument type
        if argument_type:
            history = [entry for entry in history if entry.get("argument_type") == argument_type.value]
        
        # Sort by timestamp (most recent first)
        history.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return history[:limit]
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get weakness detector performance metrics"""
        if not self.analysis_history:
            return {
                "total_analyses": 0,
                "avg_score": 0.0,
                "avg_processing_time": 0.0,
                "type_distribution": {},
                "weakness_frequency": {},
                "recent_activity": []
            }
        
        # Calculate metrics
        total_analyses = len(self.analysis_history)
        avg_score = sum(entry.get("overall_score", 0) for entry in self.analysis_history) / total_analyses
        avg_processing_time = sum(entry.get("processing_time", 0) for entry in self.analysis_history) / total_analyses
        
        # Type distribution
        type_dist = {}
        for entry in self.analysis_history:
            arg_type = entry.get("argument_type", "unknown")
            type_dist[arg_type] = type_dist.get(arg_type, 0) + 1
        
        # Weakness frequency (simulated)
        weakness_freq = {
            "logical_fallacy": 25,
            "insufficient_evidence": 30,
            "irrelevant_argument": 15,
            "legal_misapplication": 20,
            "structural_issue": 10
        }
        
        # Recent activity (last 24 hours)
        recent_time = datetime.utcnow() - timedelta(hours=24)
        recent_activity = [
            entry for entry in self.analysis_history 
            if datetime.fromisoformat(entry.get("timestamp", "")) > recent_time
        ]
        
        return {
            "total_analyses": total_analyses,
            "avg_score": round(avg_score, 1),
            "avg_processing_time": round(avg_processing_time, 2),
            "type_distribution": type_dist,
            "weakness_frequency": weakness_freq,
            "recent_activity_count": len(recent_activity),
            "recent_activity": recent_activity[:10]  # Last 10 recent analyses
        }
    
    def get_weakness_types(self) -> Dict[str, str]:
        """Get available weakness types and descriptions"""
        return {
            weakness_type.value: pattern_data["description"]
            for weakness_type, pattern_data in self.weakness_patterns.items()
        }

# Global weakness detector service instance
weakness_detector_service = WeaknessDetectorService()

# Dependency injection
def get_weakness_detector_service() -> WeaknessDetectorService:
    """Get weakness detector service instance"""
    return weakness_detector_service
