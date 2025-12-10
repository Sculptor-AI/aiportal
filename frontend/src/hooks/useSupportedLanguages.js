import { useState, useEffect } from 'react';

const useSupportedLanguages = () => {
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSupportedLanguages();
  }, []);

  const fetchSupportedLanguages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use predefined languages directly since the API endpoint doesn't exist
      const fallbackLanguages = [
        { id: 'javascript', name: 'JavaScript', executable: true },
        { id: 'python', name: 'Python', executable: true },
        { id: 'java', name: 'Java', executable: true },
        { id: 'cpp', name: 'C++', executable: true },
        { id: 'csharp', name: 'C#', executable: true },
        { id: 'php', name: 'PHP', executable: true },
        { id: 'ruby', name: 'Ruby', executable: true },
        { id: 'go', name: 'Go', executable: true },
        { id: 'rust', name: 'Rust', executable: true },
        { id: 'swift', name: 'Swift', executable: true },
        { id: 'kotlin', name: 'Kotlin', executable: true },
        { id: 'typescript', name: 'TypeScript', executable: true },
        { id: 'html', name: 'HTML', executable: false },
        { id: 'css', name: 'CSS', executable: false },
        { id: 'sql', name: 'SQL', executable: true },
        { id: 'bash', name: 'Bash', executable: true },
        { id: 'powershell', name: 'PowerShell', executable: true },
        { id: 'r', name: 'R', executable: true },
        { id: 'matlab', name: 'MATLAB', executable: true },
        { id: 'scala', name: 'Scala', executable: true },
        { id: 'perl', name: 'Perl', executable: true },
        { id: 'lua', name: 'Lua', executable: true },
        { id: 'dart', name: 'Dart', executable: true },
        { id: 'elixir', name: 'Elixir', executable: true },
        { id: 'clojure', name: 'Clojure', executable: true },
        { id: 'haskell', name: 'Haskell', executable: true },
        { id: 'ocaml', name: 'OCaml', executable: true },
        { id: 'fsharp', name: 'F#', executable: true },
        { id: 'cobol', name: 'COBOL', executable: true },
        { id: 'fortran', name: 'Fortran', executable: true },
        { id: 'pascal', name: 'Pascal', executable: true },
        { id: 'ada', name: 'Ada', executable: true },
        { id: 'lisp', name: 'Lisp', executable: true },
        { id: 'prolog', name: 'Prolog', executable: true },
        { id: 'erlang', name: 'Erlang', executable: true },
        { id: 'groovy', name: 'Groovy', executable: true },
        { id: 'julia', name: 'Julia', executable: true },
        { id: 'nim', name: 'Nim', executable: true },
        { id: 'crystal', name: 'Crystal', executable: true },
        { id: 'zig', name: 'Zig', executable: true },
        { id: 'v', name: 'V', executable: true },
        { id: 'odin', name: 'Odin', executable: true },
        { id: 'carbon', name: 'Carbon', executable: true },
        { id: 'mojo', name: 'Mojo', executable: true },
        { id: 'json', name: 'JSON', executable: false },
        { id: 'xml', name: 'XML', executable: false },
        { id: 'yaml', name: 'YAML', executable: false },
        { id: 'toml', name: 'TOML', executable: false },
        { id: 'ini', name: 'INI', executable: false },
        { id: 'markdown', name: 'Markdown', executable: false },
        { id: 'text', name: 'Plain Text', executable: false }
      ];
      
      setSupportedLanguages(fallbackLanguages);
    } catch (error) {
      console.error('Failed to initialize supported languages:', error);
      setError(error.message);
      setSupportedLanguages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isLanguageExecutable = (languageId) => {
    const language = supportedLanguages.find(lang => lang.id === languageId);
    return language ? language.executable : false;
  };

  const getLanguageDisplayName = (languageId) => {
    const language = supportedLanguages.find(lang => lang.id === languageId);
    return language ? language.name : languageId;
  };

  const getExecutableLanguages = () => {
    return supportedLanguages.filter(lang => lang.executable);
  };

  const getNonExecutableLanguages = () => {
    return supportedLanguages.filter(lang => !lang.executable);
  };

  return {
    supportedLanguages,
    isLoading,
    error,
    isLanguageExecutable,
    getLanguageDisplayName,
    getExecutableLanguages,
    getNonExecutableLanguages,
    refetch: fetchSupportedLanguages
  };
};

export default useSupportedLanguages; 