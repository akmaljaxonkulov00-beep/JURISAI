"""
Scenario Generator Service - Advanced legal scenario generation for education
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import random
import json
from dataclasses import dataclass, field
from enum import Enum

from core.logging import get_logger, performance_logger
from core.error_handling import handle_errors, JurisAIException, BusinessLogicError
from services.ai_service import AIService, AIRequest, AIModelType

logger = get_logger(__name__)

class ScenarioType(Enum):
    """Types of legal scenarios"""
    CONTRACT_DISPUTE = "contract_dispute"
    PROPERTY_DISPUTE = "property_dispute"
    TORT_CLAIM = "tort_claim"
    FAMILY_LAW = "family_law"
    CRIMINAL_CASE = "criminal_case"
    ADMINISTRATIVE_LAW = "administrative_law"
    BUSINESS_LAW = "business_law"
    EMPLOYMENT_LAW = "employment_law"

class DifficultyLevel(Enum):
    """Difficulty levels for scenarios"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class ScenarioComplexity(Enum):
    """Complexity levels for scenarios"""
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"
    VERY_COMPLEX = "very_complex"

@dataclass
class LegalScenario:
    """Legal scenario structure"""
    id: str
    title: str
    scenario_type: ScenarioType
    difficulty_level: DifficultyLevel
    complexity: ScenarioComplexity
    background: str
    facts: List[str]
    parties: Dict[str, str]
    legal_issues: List[str]
    applicable_law: List[str]
    discussion_questions: List[str]
    learning_objectives: List[str]
    estimated_time: int  # minutes
    created_at: datetime = field(default_factory=datetime.utcnow)
    tags: List[str] = field(default_factory=list)

@dataclass
class ScenarioGenerationRequest:
    """Scenario generation request"""
    scenario_type: ScenarioType
    difficulty_level: DifficultyLevel
    complexity: ScenarioComplexity
    focus_area: Optional[str] = None
    learning_objectives: Optional[List[str]] = None
    estimated_time: Optional[int] = None
    user_id: Optional[str] = None

class ScenarioGeneratorService:
    """Advanced scenario generator service with AI integration"""
    
    def __init__(self, ai_service: Optional[AIService] = None):
        self.logger = get_logger(self.__class__.__name__)
        self.ai_service = ai_service or AIService()
        self.scenario_templates = self._initialize_scenario_templates()
        self.legal_databases = self._initialize_legal_databases()
        self.generation_history: List[Dict[str, Any]] = []
        self.scenario_counter = 0
        
    def _initialize_scenario_templates(self) -> Dict[ScenarioType, Dict[str, Any]]:
        """Initialize scenario templates for different legal areas"""
        return {
            ScenarioType.CONTRACT_DISPUTE: {
                "party_types": ["individual", "corporation", "small_business", "government"],
                "contract_types": ["sales", "service", "employment", "lease", "loan"],
                "dispute_types": ["breach", "non-payment", "delivery", "quality", "termination"],
                "legal_issues": ["contract formation", "performance", "breach", "remedies"],
                "applicable_law": ["Civil Code Articles 1-10", "Commercial Law", "Contract Law"]
            },
            ScenarioType.PROPERTY_DISPUTE: {
                "party_types": ["owner", "buyer", "seller", "tenant", "landlord"],
                "property_types": ["residential", "commercial", "land", "intellectual"],
                "dispute_types": ["ownership", "boundary", "easement", "zoning", "valuation"],
                "legal_issues": ["title", "possession", "boundaries", "easements", "zoning"],
                "applicable_law": ["Civil Code Articles 150-200", "Property Law", "Land Code"]
            },
            ScenarioType.TORT_CLAIM: {
                "party_types": ["plaintiff", "defendant", "witness", "expert"],
                "tort_types": ["negligence", "intentional", "strict", "product", "defamation"],
                "damage_types": ["personal_injury", "property", "economic", "emotional"],
                "legal_issues": ["duty", "breach", "causation", "damages"],
                "applicable_law": ["Civil Code Articles 400-500", "Tort Law", "Damages Law"]
            },
            ScenarioType.FAMILY_LAW: {
                "party_types": ["spouse", "parent", "child", "guardian"],
                "family_types": ["divorce", "custody", "support", "adoption", "inheritance"],
                "dispute_types": ["division", "custody", "support", "visitation"],
                "legal_issues": ["marriage", "divorce", "custody", "support", "inheritance"],
                "applicable_law": ["Family Code", "Civil Code", "Child Protection Law"]
            },
            ScenarioType.CRIMINAL_CASE: {
                "party_types": ["defendant", "prosecutor", "victim", "witness"],
                "crime_types": ["theft", "fraud", "assault", "drugs", "white_collar"],
                "evidence_types": ["testimony", "documentary", "physical", "digital"],
                "legal_issues": ["elements", "intent", "evidence", "procedure"],
                "applicable_law": ["Criminal Code", "Criminal Procedure", "Evidence Law"]
            },
            ScenarioType.ADMINISTRATIVE_LAW: {
                "party_types": ["citizen", "agency", "official", "organization"],
                "agency_types": ["regulatory", "licensing", "tax", "zoning", "environmental"],
                "dispute_types": ["permit", "license", "regulation", "enforcement"],
                "legal_issues": ["jurisdiction", "procedure", "review", "remedies"],
                "applicable_law": ["Administrative Procedure Act", "Regulatory Law"]
            },
            ScenarioType.BUSINESS_LAW: {
                "party_types": ["corporation", "partner", "shareholder", "competitor"],
                "business_types": ["corporation", "partnership", "sole_prop", "franchise"],
                "dispute_types": ["governance", "fiduciary", "competition", "intellectual"],
                "legal_issues": ["corporate_governance", "fiduciary_duty", "competition", "IP"],
                "applicable_law": ["Corporate Law", "Commercial Code", "Competition Law"]
            },
            ScenarioType.EMPLOYMENT_LAW: {
                "party_types": ["employee", "employer", "union", "contractor"],
                "employment_types": ["full_time", "part_time", "contract", "intern"],
                "dispute_types": ["termination", "discrimination", "wages", "safety"],
                "legal_issues": ["termination", "discrimination", "wages", "safety"],
                "applicable_law": ["Labor Code", "Employment Law", "Safety Regulations"]
            }
        }
    
    def _initialize_legal_databases(self) -> Dict[str, List[str]]:
        """Initialize legal reference databases"""
        return {
            "civil_code_articles": [
                "Article 1: Basic principles of civil legislation",
                "Article 10: Grounds for liability",
                "Article 15: Jurisdiction of courts",
                "Article 41: Right to judicial protection",
                "Article 150: Property rights",
                "Article 200: Contract formation",
                "Article 300: Performance obligations",
                "Article 400: Tort liability"
            ],
            "legal_principles": [
                "Good faith principle",
                "Fair dealing",
                "Due process",
                "Equal protection",
                "Freedom of contract",
                "Property rights protection",
                "Right to remedy"
            ],
            "procedural_rules": [
                "Civil Procedure Code",
                "Criminal Procedure Code",
                "Administrative Procedure",
                "Evidence rules",
                "Appeal procedures",
                "Statute of limitations"
            ]
        }
    
    @performance_logger
    @handle_errors(log_errors=True, reraise=True)
    async def generate_scenario(self, request: ScenarioGenerationRequest) -> LegalScenario:
        """
        Generate legal scenario based on request parameters
        
        Args:
            request (ScenarioGenerationRequest): Scenario generation request
            
        Returns:
            LegalScenario: Generated legal scenario
        """
        try:
            # Generate unique scenario ID
            scenario_id = self._generate_scenario_id()
            
            # Get scenario template
            template = self.scenario_templates.get(request.scenario_type)
            if not template:
                raise BusinessLogicError(
                    f"Unsupported scenario type: {request.scenario_type}",
                    business_rule="SCENARIO_GENERATION"
                )
            
            # Generate scenario components using AI
            title = await self._generate_title(request)
            background = await self._generate_background(request, template)
            facts = await self._generate_facts(request, template)
            parties = await self._generate_parties(request, template)
            legal_issues = await self._generate_legal_issues(request, template)
            applicable_law = await self._generate_applicable_law(request, template)
            discussion_questions = await self._generate_discussion_questions(request)
            learning_objectives = request.learning_objectives or await self._generate_learning_objectives(request)
            tags = await self._generate_tags(request, template)
            
            # Calculate estimated time
            estimated_time = request.estimated_time or self._calculate_estimated_time(
                request.difficulty_level, request.complexity
            )
            
            # Create scenario
            scenario = LegalScenario(
                id=scenario_id,
                title=title,
                scenario_type=request.scenario_type,
                difficulty_level=request.difficulty_level,
                complexity=request.complexity,
                background=background,
                facts=facts,
                parties=parties,
                legal_issues=legal_issues,
                applicable_law=applicable_law,
                discussion_questions=discussion_questions,
                learning_objectives=learning_objectives,
                estimated_time=estimated_time,
                tags=tags
            )
            
            # Store generation history
            self._store_generation_history(request, scenario)
            
            self.logger.info(f"Scenario generated: {scenario_id}", extra={
                "scenario_type": request.scenario_type.value,
                "difficulty": request.difficulty_level.value,
                "complexity": request.complexity.value,
                "user_id": request.user_id
            })
            
            return scenario
            
        except Exception as e:
            self.logger.error(f"Scenario generation failed: {e}")
            raise BusinessLogicError(
                f"Failed to generate scenario: {str(e)}",
                business_rule="SCENARIO_GENERATION",
                details={"request": str(request)}
            )
    
    def _generate_scenario_id(self) -> str:
        """Generate unique scenario ID"""
        self.scenario_counter += 1
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        return f"SCN_{timestamp}_{self.scenario_counter:04d}"
    
    async def _generate_title(self, request: ScenarioGenerationRequest) -> str:
        """Generate scenario title using AI"""
        prompt = f"""
Generate a compelling title for a legal scenario with these parameters:
- Type: {request.scenario_type.value}
- Difficulty: {request.difficulty_level.value}
- Complexity: {request.complexity.value}
- Focus: {request.focus_area or 'General'}

The title should be:
1. Professional and legally appropriate
2. Engaging for students
3. Indicative of the legal issues involved
4. Suitable for {request.difficulty_level.value} level

Provide just the title, no additional text.
"""
        
        ai_request = AIRequest(
            model_type=AIModelType.SCENARIO_GENERATION,
            input_text=prompt,
            temperature=0.8,
            max_tokens=100,
            user_id=request.user_id
        )
        
        response = await self.ai_service.process_request(ai_request)
        return response.response_text.strip()
    
    async def _generate_background(self, request: ScenarioGenerationRequest, template: Dict[str, Any]) -> str:
        """Generate scenario background using AI"""
        prompt = f"""
Generate a detailed background for a {request.scenario_type.value} legal scenario.

Parameters:
- Difficulty: {request.difficulty_level.value}
- Complexity: {request.complexity.value}
- Focus: {request.focus_area or 'General'}

Available elements:
- Party types: {', '.join(template['party_types'])}
- Dispute types: {', '.join(template['dispute_types'])}

The background should:
1. Set the scene and context
2. Introduce the main parties
3. Establish the timeline
4. Create the foundation for the legal dispute
5. Be appropriate for {request.difficulty_level.value} level students

Provide 3-4 paragraphs of background information.
"""
        
        ai_request = AIRequest(
            model_type=AIModelType.SCENARIO_GENERATION,
            input_text=prompt,
            temperature=0.7,
            max_tokens=500,
            user_id=request.user_id
        )
        
        response = await self.ai_service.process_request(ai_request)
        return response.response_text.strip()
    
    async def _generate_facts(self, request: ScenarioGenerationRequest, template: Dict[str, Any]) -> List[str]:
        """Generate scenario facts using AI"""
        fact_count = self._get_fact_count(request.complexity)
        
        prompt = f"""
Generate {fact_count} key facts for a {request.scenario_type.value} legal scenario.

Parameters:
- Difficulty: {request.difficulty_level.value}
- Complexity: {request.complexity.value}
- Focus: {request.focus_area or 'General'}

Each fact should:
1. Be specific and detailed
2. Be legally relevant
3. Support the legal issues
4. Be appropriate for {request.difficulty_level.value} level

Format as a numbered list of facts.
"""
        
        ai_request = AIRequest(
            model_type=AIModelType.SCENARIO_GENERATION,
            input_text=prompt,
            temperature=0.6,
            max_tokens=400,
            user_id=request.user_id
        )
        
        response = await self.ai_service.process_request(ai_request)
        
        # Parse facts from response
        facts_text = response.response_text.strip()
        facts = []
        
        for line in facts_text.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-')):
                # Remove numbering/bullets
                fact = re.sub(r'^\d+\.?\s*|[-*]\s*', '', line).strip()
                if fact:
                    facts.append(fact)
        
        # Ensure we have the right number of facts
        while len(facts) < fact_count:
            facts.append(f"Additional fact {len(facts) + 1} for {request.scenario_type.value}")
        
        return facts[:fact_count]
    
    async def _generate_parties(self, request: ScenarioGenerationRequest, template: Dict[str, Any]) -> Dict[str, str]:
        """Generate scenario parties using AI"""
        party_count = min(4, 2 + len(request.complexity.value))
        
        prompt = f"""
Generate {party_count} parties for a {request.scenario_type.value} legal scenario.

Parameters:
- Difficulty: {request.difficulty_level.value}
- Complexity: {request.complexity.value}
- Available party types: {', '.join(template['party_types'])}

For each party provide:
1. Role (e.g., Plaintiff, Defendant, Witness)
2. Brief description
3. Relationship to other parties

Format as:
Party Name: Role - Description
"""
        
        ai_request = AIRequest(
            model_type=AIModelType.SCENARIO_GENERATION,
            input_text=prompt,
            temperature=0.7,
            max_tokens=300,
            user_id=request.user_id
        )
        
        response = await self.ai_service.process_request(ai_request)
        
        # Parse parties from response
        parties_text = response.response_text.strip()
        parties = {}
        
        for line in parties_text.split('\n'):
            line = line.strip()
            if ':' in line:
                parts = line.split(':', 1)
                if len(parts) == 2:
                    party_name = parts[0].strip()
                    party_description = parts[1].strip()
                    parties[party_name] = party_description
        
        # Ensure we have minimum parties
        if len(parties) < 2:
            parties["Party A"] = "Primary party involved in the dispute"
            parties["Party B"] = "Opposing party in the dispute"
        
        return parties
    
    async def _generate_legal_issues(self, request: ScenarioGenerationRequest, template: Dict[str, Any]) -> List[str]:
        """Generate legal issues using AI"""
        issue_count = self._get_issue_count(request.complexity)
        
        prompt = f"""
Generate {issue_count} legal issues for a {request.scenario_type.value} legal scenario.

Parameters:
- Difficulty: {request.difficulty_level.value}
- Complexity: {request.complexity.value}
- Available issues: {', '.join(template['legal_issues'])}

Each legal issue should:
1. Be framed as a question
2. Be legally relevant
3. Be appropriate for {request.difficulty_level.value} level
4. Guide student analysis

Format as a numbered list of legal questions.
"""
        
        ai_request = AIRequest(
            model_type=AIModelType.SCENARIO_GENERATION,
            input_text=prompt,
            temperature=0.5,
            max_tokens=350,
            user_id=request.user_id
        )
        
        response = await self.ai_service.process_request(ai_request)
        
        # Parse legal issues from response
        issues_text = response.response_text.strip()
        issues = []
        
        for line in issues_text.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-')):
                # Remove numbering/bullets
                issue = re.sub(r'^\d+\.?\s*|[-*]\s*', '', line).strip()
                if issue:
                    issues.append(issue)
        
        # Ensure we have the right number of issues
        while len(issues) < issue_count:
            issues.append(f"Legal issue {len(issues) + 1} for {request.scenario_type.value}")
        
        return issues[:issue_count]
    
    async def _generate_applicable_law(self, request: ScenarioGenerationRequest, template: Dict[str, Any]) -> List[str]:
        """Generate applicable law references using AI"""
        law_count = min(5, 2 + len(request.complexity.value))
        
        prompt = f"""
Generate {law_count} applicable laws for a {request.scenario_type.value} legal scenario.

Parameters:
- Difficulty: {request.difficulty_level.value}
- Complexity: {request.complexity.value}
- Available laws: {', '.join(template['applicable_law'])}

Each law reference should:
1. Be specific and accurate
2. Be relevant to the scenario
3. Include article numbers when possible
4. Be appropriate for {request.difficulty_level.value} level

Format as a numbered list.
"""
        
        ai_request = AIRequest(
            model_type=AIModelType.SCENARIO_GENERATION,
            input_text=prompt,
            temperature=0.3,
            max_tokens=300,
            user_id=request.user_id
        )
        
        response = await self.ai_service.process_request(ai_request)
        
        # Parse law references from response
        laws_text = response.response_text.strip()
        laws = []
        
        for line in laws_text.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-')):
                # Remove numbering/bullets
                law = re.sub(r'^\d+\.?\s*|[-*]\s*', '', line).strip()
                if law:
                    laws.append(law)
        
        # Ensure we have minimum laws
        if len(laws) < 2:
            laws.extend(template['applicable_law'][:2])
        
        return laws[:law_count]
    
    async def _generate_discussion_questions(self, request: ScenarioGenerationRequest) -> List[str]:
        """Generate discussion questions using AI"""
        question_count = self._get_question_count(request.complexity)
        
        prompt = f"""
Generate {question_count} discussion questions for a {request.scenario_type.value} legal scenario.

Parameters:
- Difficulty: {request.difficulty_level.value}
- Complexity: {request.complexity.value}

Each question should:
1. Promote critical thinking
2. Encourage legal analysis
3. Be open-ended
4. Be appropriate for {request.difficulty_level.value} level

Format as a numbered list.
"""
        
        ai_request = AIRequest(
            model_type=AIModelType.SCENARIO_GENERATION,
            input_text=prompt,
            temperature=0.8,
            max_tokens=400,
            user_id=request.user_id
        )
        
        response = await self.ai_service.process_request(ai_request)
        
        # Parse questions from response
        questions_text = response.response_text.strip()
        questions = []
        
        for line in questions_text.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-')):
                # Remove numbering/bullets
                question = re.sub(r'^\d+\.?\s*|[-*]\s*', '', line).strip()
                if question and question.endswith('?'):
                    questions.append(question)
        
        # Ensure we have the right number of questions
        while len(questions) < question_count:
            questions.append(f"How should the court resolve this {request.scenario_type.value} dispute?")
        
        return questions[:question_count]
    
    async def _generate_learning_objectives(self, request: ScenarioGenerationRequest) -> List[str]:
        """Generate learning objectives using AI"""
        objective_count = 3
        
        prompt = f"""
Generate {objective_count} learning objectives for a {request.scenario_type.value} legal scenario.

Parameters:
- Difficulty: {request.difficulty_level.value}
- Complexity: {request.complexity.value}

Each learning objective should:
1. Be specific and measurable
2. Focus on legal skills
3. Be appropriate for {request.difficulty_level.value} level
4. Use action verbs (analyze, apply, evaluate, etc.)

Format as a numbered list.
"""
        
        ai_request = AIRequest(
            model_type=AIModelType.SCENARIO_GENERATION,
            input_text=prompt,
            temperature=0.4,
            max_tokens=250,
            user_id=request.user_id
        )
        
        response = await self.ai_service.process_request(ai_request)
        
        # Parse objectives from response
        objectives_text = response.response_text.strip()
        objectives = []
        
        for line in objectives_text.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-')):
                # Remove numbering/bullets
                objective = re.sub(r'^\d+\.?\s*|[-*]\s*', '', line).strip()
                if objective:
                    objectives.append(objective)
        
        # Ensure we have minimum objectives
        if len(objectives) < objective_count:
            objectives.extend([
                f"Analyze legal issues in {request.scenario_type.value}",
                f"Apply relevant law to facts",
                f"Evaluate potential outcomes"
            ])
        
        return objectives[:objective_count]
    
    async def _generate_tags(self, request: ScenarioGenerationRequest, template: Dict[str, Any]) -> List[str]:
        """Generate tags for scenario categorization"""
        base_tags = [
            request.scenario_type.value,
            request.difficulty_level.value,
            request.complexity.value
        ]
        
        if request.focus_area:
            base_tags.append(request.focus_area)
        
        # Add some random relevant tags
        available_tags = ["practical", "theoretical", "procedural", "substantive", "analysis", "application"]
        additional_tags = random.sample(available_tags, min(2, len(available_tags)))
        
        return base_tags + additional_tags
    
    def _get_fact_count(self, complexity: ScenarioComplexity) -> int:
        """Get number of facts based on complexity"""
        fact_counts = {
            ScenarioComplexity.SIMPLE: 3,
            ScenarioComplexity.MODERATE: 5,
            ScenarioComplexity.COMPLEX: 7,
            ScenarioComplexity.VERY_COMPLEX: 10
        }
        return fact_counts.get(complexity, 5)
    
    def _get_issue_count(self, complexity: ScenarioComplexity) -> int:
        """Get number of legal issues based on complexity"""
        issue_counts = {
            ScenarioComplexity.SIMPLE: 2,
            ScenarioComplexity.MODERATE: 3,
            ScenarioComplexity.COMPLEX: 4,
            ScenarioComplexity.VERY_COMPLEX: 5
        }
        return issue_counts.get(complexity, 3)
    
    def _get_question_count(self, complexity: ScenarioComplexity) -> int:
        """Get number of discussion questions based on complexity"""
        question_counts = {
            ScenarioComplexity.SIMPLE: 3,
            ScenarioComplexity.MODERATE: 4,
            ScenarioComplexity.COMPLEX: 5,
            ScenarioComplexity.VERY_COMPLEX: 6
        }
        return question_counts.get(complexity, 4)
    
    def _calculate_estimated_time(self, difficulty: DifficultyLevel, complexity: ScenarioComplexity) -> int:
        """Calculate estimated completion time in minutes"""
        base_times = {
            DifficultyLevel.BEGINNER: 30,
            DifficultyLevel.INTERMEDIATE: 45,
            DifficultyLevel.ADVANCED: 60,
            DifficultyLevel.EXPERT: 90
        }
        
        complexity_multipliers = {
            ScenarioComplexity.SIMPLE: 0.8,
            ScenarioComplexity.MODERATE: 1.0,
            ScenarioComplexity.COMPLEX: 1.3,
            ScenarioComplexity.VERY_COMPLEX: 1.6
        }
        
        base_time = base_times.get(difficulty, 45)
        multiplier = complexity_multipliers.get(complexity, 1.0)
        
        return int(base_time * multiplier)
    
    def _store_generation_history(self, request: ScenarioGenerationRequest, scenario: LegalScenario):
        """Store scenario generation in history"""
        history_entry = {
            "timestamp": scenario.created_at.isoformat(),
            "scenario_id": scenario.id,
            "scenario_type": request.scenario_type.value,
            "difficulty_level": request.difficulty_level.value,
            "complexity": request.complexity.value,
            "user_id": request.user_id,
            "estimated_time": scenario.estimated_time,
            "fact_count": len(scenario.facts),
            "issue_count": len(scenario.legal_issues)
        }
        
        self.generation_history.append(history_entry)
        
        # Keep only last 1000 generations
        if len(self.generation_history) > 1000:
            self.generation_history = self.generation_history[-1000:]
    
    @performance_logger
    @handle_errors(log_errors=True, reraise=True)
    async def generate_scenario_batch(self, requests: List[ScenarioGenerationRequest]) -> List[LegalScenario]:
        """
        Generate multiple scenarios in batch
        
        Args:
            requests (List[ScenarioGenerationRequest]): List of generation requests
            
        Returns:
            List[LegalScenario]: List of generated scenarios
        """
        scenarios = []
        
        # Generate scenarios concurrently
        tasks = [self.generate_scenario(request) for request in requests]
        scenarios = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions
        valid_scenarios = []
        for i, scenario in enumerate(scenarios):
            if isinstance(scenario, Exception):
                self.logger.error(f"Scenario generation failed for request {i}: {scenario}")
            else:
                valid_scenarios.append(scenario)
        
        return valid_scenarios
    
    def get_generation_history(self, user_id: Optional[str] = None, 
                             scenario_type: Optional[ScenarioType] = None,
                             limit: int = 50) -> List[Dict[str, Any]]:
        """Get scenario generation history"""
        history = self.generation_history
        
        # Filter by user ID
        if user_id:
            history = [entry for entry in history if entry.get("user_id") == user_id]
        
        # Filter by scenario type
        if scenario_type:
            history = [entry for entry in history if entry.get("scenario_type") == scenario_type.value]
        
        # Sort by timestamp (most recent first)
        history.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return history[:limit]
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get scenario generator performance metrics"""
        if not self.generation_history:
            return {
                "total_scenarios": 0,
                "avg_generation_time": 0.0,
                "type_distribution": {},
                "difficulty_distribution": {},
                "complexity_distribution": {},
                "recent_activity": []
            }
        
        # Calculate metrics
        total_scenarios = len(self.generation_history)
        avg_estimated_time = sum(entry.get("estimated_time", 0) for entry in self.generation_history) / total_scenarios
        
        # Type distribution
        type_dist = {}
        for entry in self.generation_history:
            scenario_type = entry.get("scenario_type", "unknown")
            type_dist[scenario_type] = type_dist.get(scenario_type, 0) + 1
        
        # Difficulty distribution
        difficulty_dist = {}
        for entry in self.generation_history:
            difficulty = entry.get("difficulty_level", "unknown")
            difficulty_dist[difficulty] = difficulty_dist.get(difficulty, 0) + 1
        
        # Complexity distribution
        complexity_dist = {}
        for entry in self.generation_history:
            complexity = entry.get("complexity", "unknown")
            complexity_dist[complexity] = complexity_dist.get(complexity, 0) + 1
        
        # Recent activity (last 24 hours)
        recent_time = datetime.utcnow() - timedelta(hours=24)
        recent_activity = [
            entry for entry in self.generation_history 
            if datetime.fromisoformat(entry.get("timestamp", "")) > recent_time
        ]
        
        return {
            "total_scenarios": total_scenarios,
            "avg_estimated_time": round(avg_estimated_time, 1),
            "type_distribution": type_dist,
            "difficulty_distribution": difficulty_dist,
            "complexity_distribution": complexity_dist,
            "recent_activity_count": len(recent_activity),
            "recent_activity": recent_activity[:10]  # Last 10 recent generations
        }
    
    def get_scenario_templates(self) -> Dict[str, Any]:
        """Get available scenario templates"""
        return {
            scenario_type.value: {
                "party_types": template["party_types"],
                "dispute_types": template["dispute_types"],
                "legal_issues": template["legal_issues"],
                "applicable_law": template["applicable_law"]
            }
            for scenario_type, template in self.scenario_templates.items()
        }

# Global scenario generator service instance
scenario_generator_service = ScenarioGeneratorService()

# Dependency injection
def get_scenario_generator_service() -> ScenarioGeneratorService:
    """Get scenario generator service instance"""
    return scenario_generator_service
