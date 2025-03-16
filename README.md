# Glgo - Personalized YouTube Video Recommendations

Glgo is a personalized YouTube video recommendation engine that leverages your liked videos and search queries to provide relevant and engaging content.

## How It Works

1.  Fetches Liked Videos: Retrieves your liked videos from the YouTube API.
2.  Fetches Search Results: Fetches search results based on a user-provided query.
3.  Generates Text Embeddings: Utilizes the Gemini API to generate text embeddings for video titles and descriptions.
4.  Calculates Cosine Similarity: Employs cosine similarity to determine the relevance between your liked videos and search results.
5.  Provides Personalized Recommendations: Returns a list of video recommendations tailored to your preferences.

## Technical Overview

* In-Memory Caching: Implements in-memory caching for API responses and embeddings to improve performance.
* Batch Processing: Uses batch processing for efficient embedding generation.
* Efficient Similarity Calculations: Leverages cosine similarity for fast and accurate relevance assessment.
* Modular Design: Features structured and modular functions for maintainability and scalability.

## The Matching Magic: Cosine Similarity

Glgo uses cosine similarity to find videos that align with your interests. Here's how it works:

1.  Vector Representation: Each video's text (title and description) is converted into a vector (an "arrow" in multi-dimensional space).
2.  Comparison: Your liked videos' vectors are compared with the vectors of search results.
3.  Similarity Score: Videos with vectors pointing in similar directions are considered more relevant, resulting in a higher similarity score (between 0 and 1).
4.  Threshold: Only videos with a similarity score above 0.5 are recommended.

## Future Enhancements

* FAISS Implementation: Explore the use of FAISS (Facebook AI Similarity Search) for faster and more scalable similarity search, especially as the video database grows.
