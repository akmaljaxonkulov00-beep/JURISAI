"""
Template Engine Service - Advanced legal document template generation
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta
import json
import re
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path

from core.logging import get_logger, performance_logger
from core.error_handling import handle_errors, JurisAIException, BusinessLogicError
from services.ai_service import AIService, AIRequest, AIModelType

logger = get_logger(__name__)

class DocumentType(Enum):
    """Types of legal documents"""
    COMPLAINT = "complaint"
    PETITION = "petition"
    CONTRACT = "contract"
    LEGAL_OPINION = "legal_opinion"
    MOTION = "motion"
    BRIEF = "brief"
    AGREEMENT = "agreement"
    WILL = "will"
    POWER_OF_ATTORNEY = "power_of_attorney"
    DEED = "deed"

class TemplateCategory(Enum):
    """Template categories"""
    CIVIL_LITIGATION = "civil_litigation"
    CRIMINAL_LAW = "criminal_law"
    FAMILY_LAW = "family_law"
    BUSINESS_LAW = "business_law"
    PROPERTY_LAW = "property_law"
    ESTATE_PLANNING = "estate_planning"
    EMPLOYMENT_LAW = "employment_law"
    GENERAL = "general"

class TemplateFormat(Enum):
    """Template output formats"""
    PDF = "pdf"
    WORD = "word"
    HTML = "html"
    PLAIN_TEXT = "plain_text"

@dataclass
class TemplateField:
    """Template field definition"""
    name: str
    field_type: str  # text, number, date, choice, boolean
    required: bool
    description: str
    default_value: Optional[str] = None
    validation_regex: Optional[str] = None
    choices: Optional[List[str]] = None

@dataclass
class DocumentTemplate:
    """Document template structure"""
    id: str
    name: str
    document_type: DocumentType
    category: TemplateCategory
    description: str
    fields: List[TemplateField]
    template_content: str
    variables: Dict[str, str]  # Variable mappings
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    version: str = "1.0"
    tags: List[str] = field(default_factory=list)

@dataclass
class TemplateGenerationRequest:
    """Template generation request"""
    template_id: str
    field_values: Dict[str, Any]
    output_format: TemplateFormat = TemplateFormat.PLAIN_TEXT
    customizations: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None

@dataclass
class GeneratedDocument:
    """Generated document result"""
    template_id: str
    document_content: str
    output_format: TemplateFormat
    field_values: Dict[str, Any]
    generation_time: float
    metadata: Dict[str, Any]
    timestamp: datetime = field(default_factory=datetime.utcnow)

class TemplateEngineService:
    """Advanced template engine service with AI integration"""
    
    def __init__(self, ai_service: Optional[AIService] = None):
        self.logger = get_logger(self.__class__.__name__)
        self.ai_service = ai_service or AIService()
        self.templates: Dict[str, DocumentTemplate] = {}
        self.generation_history: List[Dict[str, Any]] = []
        self.template_counter = 0
        
        # Initialize built-in templates
        self._initialize_builtin_templates()
    
    def _initialize_builtin_templates(self):
        """Initialize built-in document templates"""
        # Complaint Template
        complaint_template = DocumentTemplate(
            id="tpl_complaint_001",
            name="Civil Complaint Template",
            document_type=DocumentType.COMPLAINT,
            category=TemplateCategory.CIVIL_LITIGATION,
            description="Standard civil complaint for Uzbekistan courts",
            fields=[
                TemplateField("court_name", "text", True, "Name of the court"),
                TemplateField("case_number", "text", False, "Case number if assigned"),
                TemplateField("plaintiff_name", "text", True, "Full name of plaintiff"),
                TemplateField("plaintiff_address", "text", True, "Address of plaintiff"),
                TemplateField("defendant_name", "text", True, "Full name of defendant"),
                TemplateField("defendant_address", "text", True, "Address of defendant"),
                TemplateField("claim_amount", "number", False, "Amount being claimed"),
                TemplateField("legal_basis", "text", True, "Legal basis for claim"),
                TemplateField("facts", "text", True, "Factual background"),
                TemplateField("prayer", "text", True, "Prayer for relief"),
                TemplateField("attorney_name", "text", False, "Attorney name"),
                TemplateField("attorney_bar_number", "text", False, "Bar number"),
                TemplateField("attorney_contact", "text", False, "Contact information")
            ],
            template_content=self._get_complaint_template_content(),
            variables={
                "date": "{{current_date}}",
                "court": "{{court_name}}",
                "plaintiff": "{{plaintiff_name}}",
                "defendant": "{{defendant_name}}"
            },
            tags=["civil", "complaint", "litigation"]
        )
        
        # Contract Template
        contract_template = DocumentTemplate(
            id="tpl_contract_001",
            name="Service Agreement Template",
            document_type=DocumentType.CONTRACT,
            category=TemplateCategory.BUSINESS_LAW,
            description="Standard service agreement contract",
            fields=[
                TemplateField("contract_date", "date", True, "Date of contract"),
                TemplateField("party_a_name", "text", True, "First party name"),
                TemplateField("party_a_address", "text", True, "First party address"),
                TemplateField("party_b_name", "text", True, "Second party name"),
                TemplateField("party_b_address", "text", True, "Second party address"),
                TemplateField("service_description", "text", True, "Description of services"),
                TemplateField("payment_amount", "number", True, "Payment amount"),
                TemplateField("payment_terms", "text", True, "Payment terms"),
                TemplateField("contract_duration", "text", True, "Duration of contract"),
                TemplateField("termination_clause", "text", False, "Termination conditions"),
                TemplateField("governing_law", "text", True, "Governing law"),
                TemplateField("dispute_resolution", "text", False, "Dispute resolution method")
            ],
            template_content=self._get_contract_template_content(),
            variables={
                "contract_number": "{{contract_id}}",
                "date": "{{contract_date}}",
                "party_a": "{{party_a_name}}",
                "party_b": "{{party_b_name}}"
            },
            tags=["contract", "business", "service"]
        )
        
        # Legal Opinion Template
        legal_opinion_template = DocumentTemplate(
            id="tpl_opinion_001",
            name="Legal Opinion Template",
            document_type=DocumentType.LEGAL_OPINION,
            category=TemplateCategory.GENERAL,
            description="Standard legal opinion format",
            fields=[
                TemplateField("client_name", "text", True, "Client name"),
                TemplateField("opinion_date", "date", True, "Date of opinion"),
                TemplateField("legal_question", "text", True, "Legal question to address"),
                TemplateField("factual_background", "text", True, "Relevant facts"),
                TemplateField("applicable_law", "text", True, "Applicable laws"),
                TemplateField("analysis", "text", True, "Legal analysis"),
                TemplateField("conclusion", "text", True, "Legal conclusion"),
                TemplateField("recommendations", "text", False, "Recommendations"),
                TemplateField("attorney_name", "text", True, "Attorney name"),
                TemplateField("law_firm", "text", False, "Law firm name"),
                TemplateField("bar_number", "text", False, "Bar number")
            ],
            template_content=self._get_legal_opinion_template_content(),
            variables={
                "date": "{{opinion_date}}",
                "client": "{{client_name}}",
                "attorney": "{{attorney_name}}"
            },
            tags=["opinion", "legal", "analysis"]
        )
        
        # Add templates to registry
        self.templates[complaint_template.id] = complaint_template
        self.templates[contract_template.id] = contract_template
        self.templates[legal_opinion_template.id] = legal_opinion_template
    
    def _get_complaint_template_content(self) -> str:
        """Get complaint template content"""
        return """
IN THE {{court_name}}
{{#if case_number}}Case No. {{case_number}}{{/if}}

{{plaintiff_name}},
{{plaintiff_address}}

Plaintiff,

v.

{{defendant_name}},
{{defendant_address}}

Defendant.

COMPLAINT

Plaintiff {{plaintiff_name}} by filing this complaint against Defendant {{defendant_name}} and alleges:

PARTIES
1. Plaintiff {{plaintiff_name}} is an individual residing at {{plaintiff_address}}.
2. Defendant {{defendant_name}} is an individual residing at {{defendant_address}}.

JURISDICTION AND VENUE
3. This Court has jurisdiction over this matter under the Civil Code of the Republic of Uzbekistan.
4. Venue is proper in this district because the events giving rise to this claim occurred here.

FACTUAL ALLEGATIONS
5. {{facts}}

LEGAL CLAIMS
6. {{legal_basis}}

DAMAGES
7. As a result of Defendant's conduct, Plaintiff has suffered damages in the amount of {{#if claim_amount}}{{claim_amount}}{{else}}to be determined at trial{{/if}}.

PRAYER FOR RELIEF
WHEREFORE, Plaintiff respectfully requests that this Court:
{{prayer}}

DEMAND FOR JURY TRIAL
8. Plaintiff demands a trial by jury on all issues so triable.

RESPECTFULLY SUBMITTED,

{{#if attorney_name}}
{{attorney_name}}
{{#if attorney_bar_number}}Bar No. {{attorney_bar_number}}{{/if}}
{{#if attorney_contact}}{{attorney_contact}}{{/if}}
Attorney for Plaintiff
{{else}}
{{plaintiff_name}}
Plaintiff, Pro Se
{{/if}}

Dated: {{current_date}}
"""
    
    def _get_contract_template_content(self) -> str:
        """Get contract template content"""
        return """
SERVICE AGREEMENT

Contract No: {{contract_id}}
Date: {{contract_date}}

PARTIES
This Service Agreement ("Agreement") is entered into on {{contract_date}} between:

{{party_a_name}}, with address at {{party_a_address}} ("Party A")
and
{{party_b_name}}, with address at {{party_b_address}} ("Party B")

SERVICES
1. Party A agrees to provide the following services to Party B:
{{service_description}}

PAYMENT
2. Party B agrees to pay Party A the amount of {{payment_amount}} for the services rendered.
3. Payment terms: {{payment_terms}}

TERM AND DURATION
4. This Agreement shall commence on {{contract_date}} and shall continue for {{contract_duration}}.

TERMINATION
5. {{#if termination_clause}}{{termination_clause}}{{else}}Either party may terminate this Agreement with 30 days written notice.{{/if}}

GOVERNING LAW
6. This Agreement shall be governed by the laws of the Republic of Uzbekistan.

DISPUTE RESOLUTION
7. {{#if dispute_resolution}}{{dispute_resolution}}{{else}}Any disputes arising from this Agreement shall be resolved through arbitration in Tashkent.{{/if}}

ENTIRE AGREEMENT
8. This Agreement constitutes the entire understanding between the parties.

IN WITNESS WHEREOF, the parties have executed this Agreement:

PARTY A:
_____________________
{{party_a_name}}
Date: {{contract_date}}

PARTY B:
_____________________
{{party_b_name}}
Date: {{contract_date}}
"""
    
    def _get_legal_opinion_template_content(self) -> str:
        """Get legal opinion template content"""
        return """
LEGAL OPINION

To: {{client_name}}
Date: {{opinion_date}}
From: {{attorney_name}}{{#if law_firm}}, {{law_firm}}{{/if}}
{{#if bar_number}}Bar No: {{bar_number}}{{/if}}

RE: {{legal_question}}

I. INTRODUCTION
This legal opinion is provided to {{client_name}} regarding the legal question: {{legal_question}}

II. FACTUAL BACKGROUND
{{factual_background}}

III. APPLICABLE LAW
{{applicable_law}}

IV. LEGAL ANALYSIS
{{analysis}}

V. CONCLUSION
Based on the foregoing analysis, it is our opinion that:

{{conclusion}}

{{#if recommendations}}
VI. RECOMMENDATIONS
{{recommendations}}
{{/if}}

VII. DISCLAIMER
This opinion is based on the facts provided and applicable law as of the date of this opinion. Laws may change, and this opinion does not create an attorney-client relationship beyond the scope of this specific matter.

CERTIFICATE OF SERVICE
I hereby certify that a copy of this legal opinion was served on {{client_name}}.

_____________________
{{attorney_name}}
{{#if law_firm}}{{law_firm}}{{/if}}
"""
    
    @performance_logger
    @handle_errors(log_errors=True, reraise=True)
    async def generate_document(self, request: TemplateGenerationRequest) -> GeneratedDocument:
        """
        Generate document from template
        
        Args:
            request (TemplateGenerationRequest): Template generation request
            
        Returns:
            GeneratedDocument: Generated document
        """
        start_time = datetime.utcnow()
        
        try:
            # Get template
            template = self.templates.get(request.template_id)
            if not template:
                raise BusinessLogicError(
                    f"Template not found: {request.template_id}",
                    business_rule="TEMPLATE_GENERATION"
                )
            
            # Validate field values
            self._validate_field_values(template.fields, request.field_values)
            
            # Process template content
            processed_content = await self._process_template_content(
                template, request.field_values, request.customizations
            )
            
            # Format output
            formatted_content = self._format_output(
                processed_content, request.output_format
            )
            
            # Calculate generation time
            generation_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Create metadata
            metadata = {
                "template_name": template.name,
                "document_type": template.document_type.value,
                "category": template.category.value,
                "field_count": len(template.fields),
                "template_version": template.version
            }
            
            # Create result
            result = GeneratedDocument(
                template_id=request.template_id,
                document_content=formatted_content,
                output_format=request.output_format,
                field_values=request.field_values,
                generation_time=generation_time,
                metadata=metadata
            )
            
            # Store generation history
            self._store_generation_history(request, result)
            
            self.logger.info(f"Document generated from template {request.template_id}", extra={
                "output_format": request.output_format.value,
                "generation_time": generation_time,
                "user_id": request.user_id
            })
            
            return result
            
        except Exception as e:
            self.logger.error(f"Document generation failed: {e}")
            raise BusinessLogicError(
                f"Failed to generate document: {str(e)}",
                business_rule="TEMPLATE_GENERATION"
            )
    
    def _validate_field_values(self, fields: List[TemplateField], field_values: Dict[str, Any]):
        """Validate field values against template requirements"""
        for field in fields:
            value = field_values.get(field.name)
            
            # Check required fields
            if field.required and (value is None or value == ""):
                raise JurisAIException(
                    f"Required field '{field.name}' is missing",
                    error_code="REQUIRED_FIELD_MISSING"
                )
            
            # Skip validation for empty optional fields
            if value is None or value == "":
                continue
            
            # Type validation
            if field.field_type == "number":
                try:
                    float(value)
                except (ValueError, TypeError):
                    raise JurisAIException(
                        f"Field '{field.name}' must be a number",
                        error_code="INVALID_FIELD_TYPE"
                    )
            elif field.field_type == "date":
                try:
                    datetime.strptime(value, "%Y-%m-%d")
                except ValueError:
                    raise JurisAIException(
                        f"Field '{field.name}' must be a valid date (YYYY-MM-DD)",
                        error_code="INVALID_FIELD_TYPE"
                    )
            elif field.field_type == "boolean":
                if str(value).lower() not in ["true", "false", "1", "0", "yes", "no"]:
                    raise JurisAIException(
                        f"Field '{field.name}' must be a boolean value",
                        error_code="INVALID_FIELD_TYPE"
                    )
            elif field.field_type == "choice":
                if field.choices and value not in field.choices:
                    raise JurisAIException(
                        f"Field '{field.name}' must be one of: {', '.join(field.choices)}",
                        error_code="INVALID_FIELD_CHOICE"
                    )
            
            # Regex validation
            if field.validation_regex and value:
                if not re.match(field.validation_regex, str(value)):
                    raise JurisAIException(
                        f"Field '{field.name}' does not match required format",
                        error_code="INVALID_FIELD_FORMAT"
                    )
    
    async def _process_template_content(self, template: DocumentTemplate, 
                                       field_values: Dict[str, Any],
                                       customizations: Optional[Dict[str, Any]]) -> str:
        """Process template content with field values"""
        content = template.template_content
        
        # Add current date
        field_values["current_date"] = datetime.now().strftime("%B %d, %Y")
        field_values["contract_id"] = f"CTR-{datetime.now().strftime('%Y%m%d')}-{self.template_counter:04d}"
        
        # Process simple variable substitution
        for var_name, var_pattern in template.variables.items():
            content = content.replace(var_pattern, str(field_values.get(var_name, "")))
        
        # Process conditional blocks (simplified)
        content = self._process_conditionals(content, field_values)
        
        # Apply AI enhancements if requested
        if customizations and customizations.get("ai_enhancement", False):
            content = await self._ai_enhance_content(content, template, field_values)
        
        return content
    
    def _process_conditionals(self, content: str, field_values: Dict[str, Any]) -> str:
        """Process conditional template blocks"""
        # Simple conditional processing for {{#if field}}...{{/if}} blocks
        import re
        
        # Find all conditional blocks
        pattern = r'\{\{#if\s+(\w+)\}\}(.*?)\{\{/if\}\}'
        
        def replace_conditional(match):
            field_name = match.group(1)
            conditional_content = match.group(2)
            
            field_value = field_values.get(field_name)
            if field_value and str(field_value).strip():
                return conditional_content
            else:
                return ""
        
        content = re.sub(pattern, replace_conditional, content, flags=re.DOTALL)
        
        return content
    
    async def _ai_enhance_content(self, content: str, template: DocumentTemplate,
                                field_values: Dict[str, Any]) -> str:
        """Use AI to enhance template content"""
        prompt = f"""
Enhance this legal document content based on the provided information:

Document Type: {template.document_type.value}
Template: {template.name}
Field Values: {json.dumps(field_values, indent=2)}

Current Content:
{content}

Please enhance the content by:
1. Improving legal language and terminology
2. Ensuring proper legal formatting
3. Adding appropriate legal boilerplate where needed
4. Maintaining the template structure
5. Ensuring all field values are properly incorporated

Return the enhanced content only, no explanations.
"""
        
        ai_request = AIRequest(
            model_type=AIModelType.DOCUMENT_GENERATION,
            input_text=prompt,
            temperature=0.2,  # Low temperature for consistent formatting
            max_tokens=2000,
            user_id="template_engine"
        )
        
        response = await self.ai_service.process_request(ai_request)
        return response.response_text.strip()
    
    def _format_output(self, content: str, output_format: TemplateFormat) -> str:
        """Format content for different output formats"""
        if output_format == TemplateFormat.HTML:
            # Convert to HTML
            content = content.replace('\n', '<br>\n')
            content = f'<div class="legal-document">{content}</div>'
        elif output_format == TemplateFormat.PDF:
            # Note: PDF generation would require additional library
            # For now, return as plain text with PDF marker
            content = f"PDF_FORMAT:\n\n{content}"
        elif output_format == TemplateFormat.WORD:
            # Note: Word generation would require additional library
            # For now, return as plain text with Word marker
            content = f"WORD_FORMAT:\n\n{content}"
        
        return content
    
    def _store_generation_history(self, request: TemplateGenerationRequest, result: GeneratedDocument):
        """Store generation in history"""
        history_entry = {
            "timestamp": result.timestamp.isoformat(),
            "template_id": request.template_id,
            "output_format": request.output_format.value,
            "field_count": len(request.field_values),
            "generation_time": result.generation_time,
            "user_id": request.user_id,
            "content_length": len(result.document_content)
        }
        
        self.generation_history.append(history_entry)
        
        # Keep only last 1000 generations
        if len(self.generation_history) > 1000:
            self.generation_history = self.generation_history[-1000:]
        
        self.template_counter += 1
    
    @performance_logger
    @handle_errors(log_errors=True, reraise=True)
    def create_custom_template(self, template_data: Dict[str, Any]) -> DocumentTemplate:
        """
        Create custom template
        
        Args:
            template_data (Dict[str, Any]): Template data
            
        Returns:
            DocumentTemplate: Created template
        """
        try:
            # Generate template ID
            template_id = f"tpl_custom_{datetime.now().strftime('%Y%m%d')}_{self.template_counter:04d}"
            
            # Parse fields
            fields = []
            for field_data in template_data.get("fields", []):
                field = TemplateField(
                    name=field_data["name"],
                    field_type=field_data["field_type"],
                    required=field_data.get("required", False),
                    description=field_data.get("description", ""),
                    default_value=field_data.get("default_value"),
                    validation_regex=field_data.get("validation_regex"),
                    choices=field_data.get("choices")
                )
                fields.append(field)
            
            # Create template
            template = DocumentTemplate(
                id=template_id,
                name=template_data["name"],
                document_type=DocumentType(template_data["document_type"]),
                category=TemplateCategory(template_data.get("category", "general")),
                description=template_data.get("description", ""),
                fields=fields,
                template_content=template_data["template_content"],
                variables=template_data.get("variables", {}),
                tags=template_data.get("tags", [])
            )
            
            # Store template
            self.templates[template_id] = template
            
            self.logger.info(f"Custom template created: {template_id}")
            
            return template
            
        except Exception as e:
            self.logger.error(f"Custom template creation failed: {e}")
            raise BusinessLogicError(
                f"Failed to create custom template: {str(e)}",
                business_rule="TEMPLATE_CREATION"
            )
    
    def get_templates(self, category: Optional[TemplateCategory] = None,
                     document_type: Optional[DocumentType] = None) -> List[DocumentTemplate]:
        """Get available templates with optional filtering"""
        templates = list(self.templates.values())
        
        # Filter by category
        if category:
            templates = [t for t in templates if t.category == category]
        
        # Filter by document type
        if document_type:
            templates = [t for t in templates if t.document_type == document_type]
        
        return templates
    
    def get_template(self, template_id: str) -> Optional[DocumentTemplate]:
        """Get template by ID"""
        return self.templates.get(template_id)
    
    def update_template(self, template_id: str, updates: Dict[str, Any]) -> Optional[DocumentTemplate]:
        """Update existing template"""
        template = self.templates.get(template_id)
        if not template:
            return None
        
        # Update allowed fields
        if "name" in updates:
            template.name = updates["name"]
        if "description" in updates:
            template.description = updates["description"]
        if "template_content" in updates:
            template.template_content = updates["template_content"]
        if "variables" in updates:
            template.variables = updates["variables"]
        if "tags" in updates:
            template.tags = updates["tags"]
        
        # Update timestamp
        template.updated_at = datetime.utcnow()
        
        self.logger.info(f"Template updated: {template_id}")
        
        return template
    
    def delete_template(self, template_id: str) -> bool:
        """Delete template"""
        if template_id in self.templates and not template_id.startswith("tpl_"):
            del self.templates[template_id]
            self.logger.info(f"Template deleted: {template_id}")
            return True
        return False
    
    def get_generation_history(self, user_id: Optional[str] = None,
                             template_id: Optional[str] = None,
                             limit: int = 50) -> List[Dict[str, Any]]:
        """Get template generation history"""
        history = self.generation_history
        
        # Filter by user ID
        if user_id:
            history = [entry for entry in history if entry.get("user_id") == user_id]
        
        # Filter by template ID
        if template_id:
            history = [entry for entry in history if entry.get("template_id") == template_id]
        
        # Sort by timestamp (most recent first)
        history.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return history[:limit]
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get template engine performance metrics"""
        if not self.generation_history:
            return {
                "total_generations": 0,
                "avg_generation_time": 0.0,
                "template_usage": {},
                "format_distribution": {},
                "recent_activity": []
            }
        
        # Calculate metrics
        total_generations = len(self.generation_history)
        avg_generation_time = sum(entry.get("generation_time", 0) for entry in self.generation_history) / total_generations
        
        # Template usage
        template_usage = {}
        for entry in self.generation_history:
            template_id = entry.get("template_id", "unknown")
            template_usage[template_id] = template_usage.get(template_id, 0) + 1
        
        # Format distribution
        format_dist = {}
        for entry in self.generation_history:
            format_type = entry.get("output_format", "unknown")
            format_dist[format_type] = format_dist.get(format_type, 0) + 1
        
        # Recent activity (last 24 hours)
        recent_time = datetime.utcnow() - timedelta(hours=24)
        recent_activity = [
            entry for entry in self.generation_history 
            if datetime.fromisoformat(entry.get("timestamp", "")) > recent_time
        ]
        
        return {
            "total_generations": total_generations,
            "avg_generation_time": round(avg_generation_time, 2),
            "template_usage": template_usage,
            "format_distribution": format_dist,
            "recent_activity_count": len(recent_activity),
            "recent_activity": recent_activity[:10]  # Last 10 recent generations
        }

# Global template engine service instance
template_engine_service = TemplateEngineService()

# Dependency injection
def get_template_engine_service() -> TemplateEngineService:
    """Get template engine service instance"""
    return template_engine_service
