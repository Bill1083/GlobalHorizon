"""
AI utilities - integration with external AI API for summarization.
"""

import os
import requests
import json


def summarize_text(text: str) -> dict:
    """
    Send text to AI API for summarization.
    Returns summary and extracted tags.
    
    TODO: Replace mock implementation with real API calls to OpenAI, Cohere, or similar.
    """
    ai_api_url = os.getenv('AI_API_URL')
    ai_api_key = os.getenv('AI_API_KEY')
    
    if not ai_api_url or not ai_api_key:
        # Return mock response if API not configured
        return mock_summarize(text)
    
    try:
        # Example: Call OpenAI API (requires OpenAI implementation)
        # headers = {'Authorization': f'Bearer {ai_api_key}'}
        # response = requests.post(
        #     ai_api_url,
        #     headers=headers,
        #     json={'text': text, 'max_tokens': 150}
        # )
        # return response.json()
        
        return mock_summarize(text)
    
    except Exception as e:
        raise Exception(f'AI API error: {str(e)}')


def mock_summarize(text: str) -> dict:
    """
    Mock AI summarization for development.
    In production, replace this with real API integration.
    """
    return {
        'summary': f"Summary of: {text[:100]}...",
        'tags': ['travel', 'landscape', 'cinematic'],
        'sentiment': 'positive'
    }


def extract_tags(text: str) -> list:
    """Extract tags/keywords from text."""
    # Simple keyword extraction (replace with NLP library like spaCy or NLTK in production)
    common_tags = ['travel', 'landscape', 'nature', 'adventure', 'cinematic', 'sunset', 'mountain']
    text_lower = text.lower()
    found_tags = [tag for tag in common_tags if tag in text_lower]
    return found_tags if found_tags else ['travel', 'landscape']
