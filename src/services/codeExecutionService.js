// Code execution service for different programming languages
// This service handles code execution through the SculptorAI API

const API_BASE_URL = 'https://api.sculptorai.org/api/v1/tools';

/**
 * Execute code in a specific language
 * @param {string} code - The code to execute
 * @param {string} language - The programming language (java, python, cpp, etc.)
 * @param {Object} variables - Optional variables to pass to the execution environment
 * @returns {Promise<Object>} Execution result with output, error, and timing
 */
export const executeCode = async (code, language, variables = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/execute-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        language: language.toLowerCase(),
        variables: variables
      })
    });

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        output: result.result.output,
        error: result.result.error || '',
        executionTime: result.execution_time,
        result: result.result.result,
        executionId: result.execution_id
      };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Code execution error:', error);
    return {
      success: false,
      error: error.message || 'Failed to execute code',
      output: '',
      executionTime: 0
    };
  }
};

/**
 * Check if a language is supported for execution
 * @param {string} language - The programming language
 * @returns {boolean} Whether the language is supported
 */
export const isLanguageSupported = (language) => {
  if (!language) return false;
  
  const supportedLanguages = [
    'python', 'py',
    'java', 
    'cpp', 'c++', 'c',
    'javascript', 'js',
    'typescript', 'ts',
    'node', 'nodejs',
    'bash', 'shell',
    'php',
    'ruby',
    'go',
    'rust',
    'swift',
    'kotlin',
    'scala',
    'r',
    'sql',
    'csharp', 'cs'
  ];
  
  return supportedLanguages.includes(language.toLowerCase());
};

/**
 * Get language display name
 * @param {string} language - The programming language code
 * @returns {string} Display name for the language
 */
export const getLanguageDisplayName = (language) => {
  if (!language) return 'code';
  
  const languageMap = {
    'python': 'Python',
    'py': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c++': 'C++',
    'c': 'C',
    'javascript': 'JavaScript',
    'js': 'JavaScript',
    'typescript': 'TypeScript',
    'ts': 'TypeScript',
    'node': 'Node.js',
    'nodejs': 'Node.js',
    'bash': 'Bash',
    'shell': 'Shell',
    'php': 'PHP',
    'ruby': 'Ruby',
    'go': 'Go',
    'rust': 'Rust',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'scala': 'Scala',
    'r': 'R',
    'sql': 'SQL',
    'csharp': 'C#',
    'cs': 'C#'
  };
  
  return languageMap[language.toLowerCase()] || language;
};

/**
 * Detect programming language from code content
 * @param {string} code - The code to analyze
 * @returns {string} Detected language
 */
export const detectLanguage = (code) => {
  if (!code) return 'python';
  
  const firstLine = code.trim().split('\n')[0].toLowerCase();
  
  // Check for shebang
  if (firstLine.startsWith('#!')) {
    if (firstLine.includes('python')) return 'python';
    if (firstLine.includes('node')) return 'javascript';
    if (firstLine.includes('bash')) return 'bash';
  }

  // Check for language-specific patterns
  if (code.includes('import ') && code.includes('print(')) return 'python';
  if (code.includes('console.log') || code.includes('function') || code.includes('const ') || code.includes('let ')) return 'javascript';
  if (code.includes('public class') || code.includes('System.out.println')) return 'java';
  if (code.includes('#include <iostream>') || code.includes('std::cout')) return 'cpp';
  if (code.includes('#include <stdio.h>') || code.includes('printf(')) return 'c';
  if (code.includes('using System;') || code.includes('Console.WriteLine')) return 'csharp';
  if (code.includes('<?php') || code.includes('echo ')) return 'php';
  if (code.includes('puts ') || code.includes('def ')) return 'ruby';
  if (code.includes('package main') || code.includes('fmt.Println')) return 'go';
  if (code.includes('fn main') || code.includes('println!')) return 'rust';
  if (code.includes('import Swift') || code.includes('print(')) return 'swift';
  if (code.includes('fun main') || code.includes('println(')) return 'kotlin';
  if (code.includes('object ') && code.includes('def ')) return 'scala';
  if (code.includes('cat(') || code.includes('print(')) return 'r';
  if (code.includes('#!/bin/bash') || code.includes('echo ')) return 'bash';
  if (code.includes('SELECT ') || code.includes('CREATE TABLE')) return 'sql';
  if (code.includes('interface ') || code.includes('type ')) return 'typescript';

  return 'python'; // default
}; 