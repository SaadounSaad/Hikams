// Exemple React Hook pour charger la base et chercher un synonyme
import { useState, useEffect } from "react";

export default function useArabicSynonyms(word) {
  const [synonyms, setSynonyms] = useState([]);

  useEffect(() => {
    fetch("/ar-thesaurus.json")
      .then((res) => res.json())
      .then((data) => {
        setSynonyms(data[word] || []);
      });
  }, [word]);

  return synonyms;
}
