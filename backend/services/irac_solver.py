"""
IRAC Solver Service
O'zbekiston qonunchiligiga moslashgan IRAC metodologiyasi bo'yicha tahlil
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import re
import json
from dataclasses import dataclass, field
from enum import Enum
import uuid

logger = logging.getLogger(__name__)

class IRACComponent(Enum):
    """IRAC component types"""
    ISSUE = "issue"
    RULE = "rule"
    APPLICATION = "application"
    CONCLUSION = "conclusion"

class DifficultyLevel(Enum):
    """Difficulty levels for IRAC analysis"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

@dataclass
class IRACAnalysisResult:
    """IRAC analysis result structure"""
    issue: str
    rule: str
    application: str
    conclusion: str
    confidence_score: float
    legal_references: List[str]
    analysis_notes: str
    difficulty_level: DifficultyLevel
    processing_time: float
    timestamp: datetime = field(default_factory=datetime.utcnow)

@dataclass
class IRACEvaluationResult:
    """IRAC evaluation result structure"""
    component_scores: Dict[str, float]
    overall_score: float
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    detailed_feedback: Dict[str, str]
    evaluation_timestamp: datetime = field(default_factory=datetime.utcnow)

class IRACSolverService:
    """Advanced IRAC solver service with AI integration"""
    
    def __init__(self, ai_service: Optional[AIService] = None):
        self.logger = get_logger(self.__class__.__name__)
        self.ai_service = ai_service or AIService()
        self.legal_templates = self._initialize_legal_templates()
        self.scoring_criteria = self._initialize_scoring_criteria()
        self.analysis_history: List[Dict[str, Any]] = []
        
    def _initialize_legal_templates(self) -> Dict[str, Dict[str, str]]:
        """Initialize legal templates for different case types"""
        return {
            "contract_dispute": {
                "issue_template": "Whether {party1} breached the contract with {party2} regarding {subject_matter}",
                "rule_template": "Under Civil Code Article {article}, contracts are binding obligations that must be performed in good faith",
                "application_template": "Applying the contract law principles to the facts, the court must examine whether the essential elements of a valid contract exist",
                "conclusion_template": "Based on the analysis, the court should find that {finding} and award {remedy}"
            },
            "property_dispute": {
                "issue_template": "Whether {party1} has valid property rights against {party2} regarding {property_type}",
                "rule_template": "Under Civil Code Article {article}, property rights are protected and must be respected by all parties",
                "application_template": "The court must examine the chain of title, registration documents, and relevant evidence to determine ownership",
                "conclusion_template": "The evidence supports {finding} and the court should order {remedy}"
            },
            "tort_claim": {
                "issue_template": "Whether {defendant} is liable for damages caused to {plaintiff} through {act_type}",
                "rule_template": "Under Civil Code Article {article}, liability arises when wrongful acts cause damage to another party",
                "application_template": "The court must establish duty, breach, causation, and damages to determine liability",
                "conclusion_template": "Based on the established elements, {defendant} is {finding} and should pay {damages}"
            }
        }
    
    def _initialize_scoring_criteria(self) -> Dict[str, Dict[str, float]]:
        """Initialize scoring criteria for IRAC components"""
        return {
            "issue": {
                "clarity": 0.3,
                "legal_relevance": 0.4,
                "specificity": 0.3
            },
            "rule": {
                "accuracy": 0.4,
                "completeness": 0.3,
                "relevance": 0.3
            },
            "application": {
                "logical_flow": 0.3,
                "fact_analysis": 0.4,
                "legal_application": 0.3
            },
            "conclusion": {
                "clarity": 0.3,
                "logical_consistency": 0.4,
                "practicality": 0.3
            }
        }
    
    @performance_logger
    @handle_errors(log_errors=True, reraise=True)
    async def analyze_case(self, case_description: str, user_id: str, 
                          difficulty_level: DifficultyLevel = DifficultyLevel.INTERMEDIATE,
                          case_type: str = "general") -> IRACAnalysisResult:
        """
        Analyze legal case using IRAC methodology
        
        Args:
            case_description (str): Description of the legal case
            user_id (str): User ID requesting analysis
            difficulty_level (DifficultyLevel): Analysis difficulty level
            case_type (str): Type of legal case
            
        Returns:
            IRACAnalysisResult: Complete IRAC analysis
        """
        start_time = datetime.utcnow()
        
        try:
            # Preprocess case description
            processed_case = self._preprocess_case_description(case_description)
            
            # Determine case type if not provided
            if case_type == "general":
                case_type = self._determine_case_type(processed_case)
            
            # Extract IRAC components using AI
            issue = await self._extract_issue(processed_case, case_type, difficulty_level)
            rule = await self._extract_rule(processed_case, case_type, difficulty_level)
            application = await self._extract_application(processed_case, case_type, difficulty_level)
            conclusion = await self._extract_conclusion(processed_case, case_type, difficulty_level)
            
            # Calculate confidence score
            confidence_score = self._calculate_overall_confidence(issue, rule, application, conclusion)
            
            # Extract legal references
            legal_references = self._extract_legal_references(issue, rule, application, conclusion)
            
            # Generate analysis notes
            analysis_notes = self._generate_analysis_notes(processed_case, issue, rule, application, conclusion)
            
            # Calculate processing time
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Create result
            result = IRACAnalysisResult(
                issue=issue,
                rule=rule,
                application=application,
                conclusion=conclusion,
                confidence_score=confidence_score,
                legal_references=legal_references,
                analysis_notes=analysis_notes,
                difficulty_level=difficulty_level,
                processing_time=processing_time
            )
            
            # Store analysis in history
            self._store_analysis_history(user_id, case_description, result)
            
            self.logger.info(f"IRAC analysis completed for user {user_id}", extra={
                "case_type": case_type,
                "difficulty": difficulty_level.value,
                "confidence_score": confidence_score,
                "processing_time": processing_time
            })
            
            return result
            
        except Exception as e:
            self.logger.error(f"IRAC analysis failed: {e}")
            raise BusinessLogicError(
                f"Failed to analyze case: {str(e)}",
                business_rule="IRAC_ANALYSIS",
                details={"case_description": case_description[:100], "user_id": user_id}
            )
    
    def _preprocess_case_description(self, case_description: str) -> str:
        """Preprocess case description for analysis"""
        # Clean and normalize text
        processed = case_description.strip()
        
        # Remove extra whitespace
        processed = re.sub(r'\s+', ' ', processed)
        
        # Ensure proper sentence structure
        processed = re.sub(r'([.!?])\s*([a-z])', r'\1 \2', processed)
        
        # Add legal context if missing
        legal_keywords = ['court', 'law', 'legal', 'contract', 'dispute', 'claim', 'case']
        if not any(keyword in processed.lower() for keyword in legal_keywords):
            processed = f"Legal case: {processed}"
        
        return processed
    
    def _determine_case_type(self, case_description: str) -> str:
        """Determine the type of legal case"""
        case_description_lower = case_description.lower()
        
        if any(keyword in case_description_lower for keyword in ['contract', 'agreement', 'breach']):
            return "contract_dispute"
        elif any(keyword in case_description_lower for keyword in ['property', 'land', 'ownership', 'title']):
            return "property_dispute"
        elif any(keyword in case_description_lower for keyword in ['damage', 'injury', 'harm', 'negligence']):
            return "tort_claim"
        else:
            return "general"
    
    async def _extract_issue(self, case_description: str, case_type: str, difficulty: DifficultyLevel) -> str:
        """Extract legal issue using AI"""
        prompt = f"""
Extract the central legal issue from this case description for {difficulty.value} level analysis:

Case: {case_description}
Case Type: {case_type}

Focus on identifying:
1. The specific legal question to be resolved
2. The parties involved
3. The core legal dispute
4. The remedy sought

Provide a clear, concise legal issue statement that frames the problem for legal analysis.
"""
        
        ai_request = AIRequest(
            model_type=AIModelType.IRAC_ANALYSIS,
            input_text=prompt,
            context={"component": "issue", "difficulty": difficulty.value},
            temperature=0.3,
            user_id="irac_solver"
        )
        
        response = await self.ai_service.process_request(ai_request)
        return self._format_issue_response(response.response_text, case_type)
    
    async def _extract_rule(self, case_description: str, case_type: str, difficulty: DifficultyLevel) -> str:
        """Extract applicable legal rules using AI"""
        prompt = f"""
Identify the applicable legal rules and principles for this case:

Case: {case_description}
Case Type: {case_type}
Difficulty Level: {difficulty.value}

Include:
1. Relevant statutes and articles from Uzbekistan law
2. Legal principles and doctrines
3. Case law precedents if applicable
4. Constitutional provisions if relevant

Provide comprehensive legal authority that governs this type of dispute.
"""
        
        ai_request = AIRequest(
            model_type=AIModelType.IRAC_ANALYSIS,
            input_text=prompt,
            context={"component": "rule", "difficulty": difficulty.value},
            temperature=0.2,
            user_id="irac_solver"
        )
        
        response = await self.ai_service.process_request(ai_request)
        return self._format_rule_response(response.response_text, case_type)
    
    async def _extract_application(self, case_description: str, case_type: str, difficulty: DifficultyLevel) -> str:
        """Extract legal application using AI"""
        prompt = f"""
Apply the legal rules to the facts of this case:

Case: {case_description}
Case Type: {case_type}
Difficulty Level: {difficulty.value}

Provide detailed analysis that:
1. Applies relevant law to specific facts
2. Analyzes each element of the legal claim
3. Addresses counterarguments if any
4. Shows logical reasoning process

Ensure the application demonstrates how the law governs these specific facts.
"""
        
        ai_request = AIRequest(
            model_type=AIModelType.IRAC_ANALYSIS,
            input_text=prompt,
            context={"component": "application", "difficulty": difficulty.value},
            temperature=0.4,
            user_id="irac_solver"
        )
        
        response = await self.ai_service.process_request(ai_request)
        return self._format_application_response(response.response_text, case_type)
    
    async def _extract_conclusion(self, case_description: str, case_type: str, difficulty: DifficultyLevel) -> str:
        """Extract legal conclusion using AI"""
        prompt = f"""
Provide a legal conclusion based on the analysis:

Case: {case_description}
Case Type: {case_type}
Difficulty Level: {difficulty.value}

The conclusion should:
1. Directly answer the legal issue
2. Summarize key findings from the application
3. State the likely outcome
4. Suggest appropriate remedies or relief

Provide a clear, authoritative legal conclusion.
"""
        
        ai_request = AIRequest(
            model_type=AIModelType.IRAC_ANALYSIS,
            input_text=prompt,
            context={"component": "conclusion", "difficulty": difficulty.value},
            temperature=0.3,
            user_id="irac_solver"
        )
        
        response = await self.ai_service.process_request(ai_request)
        return self._format_conclusion_response(response.response_text, case_type)
    
    def _format_issue_response(self, response: str, case_type: str) -> str:
        """Format issue response"""
        # Clean up AI response
        issue = response.strip()
        
        # Remove common AI response prefixes
        prefixes_to_remove = ["The legal issue is:", "Issue:", "Central issue:"]
        for prefix in prefixes_to_remove:
            if issue.startswith(prefix):
                issue = issue[len(prefix):].strip()
        
        # Ensure proper formatting
        if not issue.endswith("?"):
            issue += "?"
        
        return issue
    
    def _format_rule_response(self, response: str, case_type: str) -> str:
        """Format rule response"""
        # Clean up AI response
        rule = response.strip()
        
        # Ensure proper structure with bullet points
        if not rule.startswith("-") and not rule.startswith("*"):
            # Convert to bullet points if not already formatted
            sentences = rule.split(". ")
            formatted_sentences = []
            for sentence in sentences:
                if sentence.strip():
                    formatted_sentences.append(f"- {sentence.strip()}")
            rule = "\n".join(formatted_sentences)
        
        return rule
    
    def _format_application_response(self, response: str, case_type: str) -> str:
        """Format application response"""
        # Clean up AI response
        application = response.strip()
        
        # Ensure proper paragraph structure
        if not application.startswith("Applying") and not application.startswith("Based on"):
            application = f"Applying the relevant legal principles to the facts:\n\n{application}"
        
        return application
    
    def _format_conclusion_response(self, response: str, case_type: str) -> str:
        """Format conclusion response"""
        # Clean up AI response
        conclusion = response.strip()
        
        # Ensure proper conclusion structure
        if not conclusion.startswith("Based on") and not conclusion.startswith("Therefore"):
            conclusion = f"Based on the foregoing analysis, {conclusion}"
        
        return conclusion
    
    def _calculate_overall_confidence(self, issue: str, rule: str, application: str, conclusion: str) -> float:
        """Calculate overall confidence score for IRAC analysis"""
        component_scores = []
        
        # Score each component based on length and content quality
        for component in [issue, rule, application, conclusion]:
            # Base score from length (adequate detail)
            length_score = min(len(component) / 200, 1.0) * 0.3
            
            # Content quality score (presence of legal keywords)
            legal_keywords = ['law', 'legal', 'court', 'article', 'section', 'statute', 'precedent']
            keyword_score = sum(1 for keyword in legal_keywords if keyword.lower() in component.lower()) / len(legal_keywords) * 0.4
            
            # Structure score (proper formatting)
            structure_score = 0.3 if len(component.split('\n')) > 1 else 0.2
            
            component_score = length_score + keyword_score + structure_score
            component_scores.append(min(component_score, 1.0))
        
        # Calculate overall confidence
        overall_confidence = sum(component_scores) / len(component_scores)
        
        return round(overall_confidence, 2)
    
    def _extract_legal_references(self, issue: str, rule: str, application: str, conclusion: str) -> List[str]:
        """Extract legal references from IRAC components"""
        all_text = f"{issue} {rule} {application} {conclusion}"
        
        # Pattern for legal references
        patterns = [
            r'Article\s+(\d+)',
            r'Art\.\s*(\d+)',
            r'Section\s+(\d+)',
            r'Code\s+of\s+Uzbekistan',
            r'Constitution\s+of\s+Uzbekistan'
        ]
        
        references = set()
        for pattern in patterns:
            matches = re.findall(pattern, all_text, re.IGNORECASE)
            for match in matches:
                if match.isdigit():
                    references.add(f"Article {match}")
                else:
                    references.add(match)
        
        # Add common references if none found
        if not references:
            references = {
                "Civil Code of Uzbekistan",
                "Civil Procedure Code of Uzbekistan",
                "Constitution of Uzbekistan"
            }
        
        return sorted(list(references))
    
    def _generate_analysis_notes(self, case_description: str, issue: str, rule: str, 
                                application: str, conclusion: str) -> str:
        """Generate analysis notes and insights"""
        notes = []
        
        # Analyze complexity
        total_length = len(issue) + len(rule) + len(application) + len(conclusion)
        if total_length > 1000:
            notes.append("Comprehensive analysis with detailed legal reasoning")
        elif total_length > 500:
            notes.append("Moderate complexity analysis")
        else:
            notes.append("Basic analysis suitable for introductory level")
        
        # Check for legal depth
        if "precedent" in rule.lower() or "case law" in rule.lower():
            notes.append("Analysis incorporates case law and precedents")
        
        # Check for practical application
        if "remedy" in conclusion.lower() or "relief" in conclusion.lower():
            notes.append("Conclusion provides practical remedies and relief")
        
        # Check for structure quality
        if all(len(comp) > 50 for comp in [issue, rule, application, conclusion]):
            notes.append("All IRAC components are well-developed")
        
        return "; ".join(notes) if notes else "Standard IRAC analysis completed"
    
    def _store_analysis_history(self, user_id: str, case_description: str, result: IRACAnalysisResult):
        """Store analysis in history"""
        history_entry = {
            "timestamp": result.timestamp.isoformat(),
            "user_id": user_id,
            "case_description": case_description[:200],  # Truncate for storage
            "difficulty_level": result.difficulty_level.value,
            "confidence_score": result.confidence_score,
            "processing_time": result.processing_time,
            "legal_references_count": len(result.legal_references)
        }
        
        self.analysis_history.append(history_entry)
        
        # Keep only last 1000 analyses
        if len(self.analysis_history) > 1000:
            self.analysis_history = self.analysis_history[-1000:]
    
    @performance_logger
    @handle_errors(log_errors=True, reraise=True)
    async def evaluate_analysis(self, analysis_result: IRACAnalysisResult, 
                               evaluation_criteria: Optional[List[str]] = None) -> IRACEvaluationResult:
        """
        Evaluate IRAC analysis quality
        
        Args:
            analysis_result (IRACAnalysisResult): IRAC analysis to evaluate
            evaluation_criteria (Optional[List[str]]): Custom evaluation criteria
            
        Returns:
            IRACEvaluationResult: Detailed evaluation results
        """
        try:
            # Evaluate each component
            component_scores = {}
            detailed_feedback = {}
            
            # Evaluate Issue
            issue_score, issue_feedback = self._evaluate_component(
                analysis_result.issue, "issue", evaluation_criteria
            )
            component_scores["issue"] = issue_score
            detailed_feedback["issue"] = issue_feedback
            
            # Evaluate Rule
            rule_score, rule_feedback = self._evaluate_component(
                analysis_result.rule, "rule", evaluation_criteria
            )
            component_scores["rule"] = rule_score
            detailed_feedback["rule"] = rule_feedback
            
            # Evaluate Application
            application_score, application_feedback = self._evaluate_component(
                analysis_result.application, "application", evaluation_criteria
            )
            component_scores["application"] = application_score
            detailed_feedback["application"] = application_feedback
            
            # Evaluate Conclusion
            conclusion_score, conclusion_feedback = self._evaluate_component(
                analysis_result.conclusion, "conclusion", evaluation_criteria
            )
            component_scores["conclusion"] = conclusion_score
            detailed_feedback["conclusion"] = conclusion_feedback
            
            # Calculate overall score
            overall_score = sum(component_scores.values()) / len(component_scores)
            
            # Generate strengths and weaknesses
            strengths, weaknesses = self._analyze_strengths_weaknesses(component_scores, detailed_feedback)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(component_scores, weaknesses)
            
            return IRACEvaluationResult(
                component_scores=component_scores,
                overall_score=overall_score,
                strengths=strengths,
                weaknesses=weaknesses,
                recommendations=recommendations,
                detailed_feedback=detailed_feedback
            )
            
        except Exception as e:
            self.logger.error(f"IRAC evaluation failed: {e}")
            raise BusinessLogicError(
                f"Failed to evaluate analysis: {str(e)}",
                business_rule="IRAC_EVALUATION"
            )
    
    def _evaluate_component(self, component_text: str, component_type: str, 
                           custom_criteria: Optional[List[str]] = None) -> Tuple[float, str]:
        """Evaluate individual IRAC component"""
        criteria = self.scoring_criteria.get(component_type, {})
        feedback = []
        scores = []
        
        # Evaluate based on criteria
        for criterion, weight in criteria.items():
            if criterion == "clarity":
                score = self._evaluate_clarity(component_text)
                feedback.append(f"Clarity: {score:.1%}")
            elif criterion == "legal_relevance":
                score = self._evaluate_legal_relevance(component_text)
                feedback.append(f"Legal Relevance: {score:.1%}")
            elif criterion == "specificity":
                score = self._evaluate_specificity(component_text)
                feedback.append(f"Specificity: {score:.1%}")
            elif criterion == "accuracy":
                score = self._evaluate_accuracy(component_text)
                feedback.append(f"Accuracy: {score:.1%}")
            elif criterion == "completeness":
                score = self._evaluate_completeness(component_text, component_type)
                feedback.append(f"Completeness: {score:.1%}")
            elif criterion == "logical_flow":
                score = self._evaluate_logical_flow(component_text)
                feedback.append(f"Logical Flow: {score:.1%}")
            elif criterion == "fact_analysis":
                score = self._evaluate_fact_analysis(component_text)
                feedback.append(f"Fact Analysis: {score:.1%}")
            elif criterion == "legal_application":
                score = self._evaluate_legal_application(component_text)
                feedback.append(f"Legal Application: {score:.1%}")
            elif criterion == "practicality":
                score = self._evaluate_practicality(component_text)
                feedback.append(f"Practicality: {score:.1%}")
            
            scores.append(score * weight)
        
        # Calculate weighted score
        total_score = sum(scores)
        
        # Generate detailed feedback
        detailed_feedback = f"{component_type.title()} Evaluation:\n" + "\n".join(feedback)
        
        return total_score, detailed_feedback
    
    def _evaluate_clarity(self, text: str) -> float:
        """Evaluate text clarity"""
        # Check for clear sentence structure
        sentences = text.split('.')
        clear_sentences = sum(1 for s in sentences if len(s.strip()) > 10 and len(s.strip()) < 200)
        return min(clear_sentences / max(len(sentences), 1), 1.0)
    
    def _evaluate_legal_relevance(self, text: str) -> float:
        """Evaluate legal relevance"""
        legal_terms = ['law', 'legal', 'court', 'statute', 'article', 'regulation', 'precedent']
        legal_count = sum(1 for term in legal_terms if term.lower() in text.lower())
        return min(legal_count / len(legal_terms), 1.0)
    
    def _evaluate_specificity(self, text: str) -> float:
        """Evaluate specificity"""
        # Check for specific details vs general statements
        specific_indicators = ['specifically', 'particular', 'exactly', 'precisely', 'detailed']
        specificity_score = sum(1 for indicator in specific_indicators if indicator.lower() in text.lower())
        return min(specificity_score / len(specific_indicators), 1.0)
    
    def _evaluate_accuracy(self, text: str) -> float:
        """Evaluate legal accuracy (simplified)"""
        # Check for common legal patterns
        accurate_patterns = ['under', 'according to', 'pursuant to', 'in accordance with']
        accuracy_score = sum(1 for pattern in accurate_patterns if pattern.lower() in text.lower())
        return min(accuracy_score / len(accurate_patterns), 1.0)
    
    def _evaluate_completeness(self, text: str, component_type: str) -> float:
        """Evaluate component completeness"""
        # Minimum length requirements for each component
        min_lengths = {
            "issue": 50,
            "rule": 100,
            "application": 150,
            "conclusion": 75
        }
        
        min_length = min_lengths.get(component_type, 100)
        return min(len(text) / min_length, 1.0)
    
    def _evaluate_logical_flow(self, text: str) -> float:
        """Evaluate logical flow"""
        # Check for logical connectors
        logical_connectors = ['therefore', 'because', 'since', 'thus', 'consequently', 'however']
        connector_count = sum(1 for connector in logical_connectors if connector.lower() in text.lower())
        return min(connector_count / len(logical_connectors), 1.0)
    
    def _evaluate_fact_analysis(self, text: str) -> float:
        """Evaluate fact analysis"""
        # Check for fact-related terms
        fact_terms = ['fact', 'evidence', 'proof', 'testimony', 'documentation']
        fact_count = sum(1 for term in fact_terms if term.lower() in text.lower())
        return min(fact_count / len(fact_terms), 1.0)
    
    def _evaluate_legal_application(self, text: str) -> float:
        """Evaluate legal application"""
        # Check for application indicators
        application_terms = ['apply', 'application', 'govern', 'control', 'regulate']
        application_count = sum(1 for term in application_terms if term.lower() in text.lower())
        return min(application_count / len(application_terms), 1.0)
    
    def _evaluate_practicality(self, text: str) -> float:
        """Evaluate practicality"""
        # Check for practical outcomes
        practical_terms = ['remedy', 'relief', 'damages', 'injunction', 'specific performance']
        practical_count = sum(1 for term in practical_terms if term.lower() in text.lower())
        return min(practical_count / len(practical_terms), 1.0)
    
    def _analyze_strengths_weaknesses(self, component_scores: Dict[str, float], 
                                   detailed_feedback: Dict[str, str]) -> Tuple[List[str], List[str]]:
        """Analyze strengths and weaknesses"""
        strengths = []
        weaknesses = []
        
        for component, score in component_scores.items():
            if score >= 0.8:
                strengths.append(f"Excellent {component} with score of {score:.1%}")
            elif score >= 0.6:
                strengths.append(f"Good {component} with score of {score:.1%}")
            elif score < 0.4:
                weaknesses.append(f"Weak {component} needs improvement (score: {score:.1%})")
            else:
                weaknesses.append(f"{component} could be strengthened (score: {score:.1%})")
        
        return strengths, weaknesses
    
    def _generate_recommendations(self, component_scores: Dict[str, float], 
                                weaknesses: List[str]) -> List[str]:
        """Generate improvement recommendations"""
        recommendations = []
        
        for component, score in component_scores.items():
            if score < 0.7:
                if component == "issue":
                    recommendations.append("Make the issue more specific and legally precise")
                elif component == "rule":
                    recommendations.append("Include more specific legal citations and statutes")
                elif component == "application":
                    recommendations.append("Strengthen the connection between facts and law")
                elif component == "conclusion":
                    recommendations.append("Provide clearer outcome and specific remedies")
        
        # General recommendations
        if len(weaknesses) > 2:
            recommendations.append("Consider reviewing the entire analysis for consistency")
        
        if not recommendations:
            recommendations.append("Analysis is well-structured; consider adding more depth to legal arguments")
        
        return recommendations
    
    def get_analysis_history(self, user_id: Optional[str] = None, 
                           limit: int = 50) -> List[Dict[str, Any]]:
        """Get analysis history"""
        history = self.analysis_history
        
        if user_id:
            history = [entry for entry in history if entry.get("user_id") == user_id]
        
        # Sort by timestamp (most recent first)
        history.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return history[:limit]
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get IRAC solver performance metrics"""
        if not self.analysis_history:
            return {
                "total_analyses": 0,
                "avg_confidence_score": 0.0,
                "avg_processing_time": 0.0,
                "difficulty_distribution": {},
                "recent_activity": []
            }
        
        # Calculate metrics
        total_analyses = len(self.analysis_history)
        avg_confidence = sum(entry.get("confidence_score", 0) for entry in self.analysis_history) / total_analyses
        avg_processing_time = sum(entry.get("processing_time", 0) for entry in self.analysis_history) / total_analyses
        
        # Difficulty distribution
        difficulty_dist = {}
        for entry in self.analysis_history:
            difficulty = entry.get("difficulty_level", "unknown")
            difficulty_dist[difficulty] = difficulty_dist.get(difficulty, 0) + 1
        
        # Recent activity (last 24 hours)
        recent_time = datetime.utcnow() - timedelta(hours=24)
        recent_activity = [
            entry for entry in self.analysis_history 
            if datetime.fromisoformat(entry.get("timestamp", "")) > recent_time
        ]
        
        return {
            "total_analyses": total_analyses,
            "avg_confidence_score": round(avg_confidence, 2),
            "avg_processing_time": round(avg_processing_time, 2),
            "difficulty_distribution": difficulty_dist,
            "recent_activity_count": len(recent_activity),
            "recent_activity": recent_activity[:10]  # Last 10 recent analyses
        }

# Global IRAC solver service instance
irac_solver_service = IRACSolverService()

# Dependency injection
def get_irac_solver_service() -> IRACSolverService:
    """Get IRAC solver service instance"""
    return irac_solver_service
