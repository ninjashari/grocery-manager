from typing import List, Optional
from .base_processor import BaseReceiptProcessor
from .kpn_processor import KPNProcessor
from .dmart_processor import DMartProcessor

class ProcessorFactory:
    
    def __init__(self):
        self.processors: List[BaseReceiptProcessor] = [
            KPNProcessor(),
            DMartProcessor()
        ]
    
    def get_processor(self, text: str) -> BaseReceiptProcessor:
        """Get the appropriate processor for the given text"""
        for processor in self.processors:
            if processor.can_process(text):
                print(f"Using {processor.name} processor")
                return processor
        
        # Default to KPN processor as fallback
        print("No specific processor found, using KPN processor as fallback")
        return KPNProcessor()
    
    def get_all_processors(self) -> List[BaseReceiptProcessor]:
        """Get all available processors"""
        return self.processors
    
    def add_processor(self, processor: BaseReceiptProcessor):
        """Add a new processor"""
        self.processors.append(processor)
    
    def list_supported_stores(self) -> List[str]:
        """List all supported store names"""
        return [processor.name for processor in self.processors]