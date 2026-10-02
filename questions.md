Rédige un tableau JSON strict contenant 800 questions de quiz en français, réparties équitablement sur les 8 thèmes suivants (soit 100 questions par thème) :

1. Culture générale
2. Cinéma & séries
3. Musique
4. Pop culture & internet
5. Sciences & nature
6. Gastronomie & terroir
7. Sport
8. Langue française

### Contraintes de contenu et de structure

1. **Difficulté variable** : Pour chaque thème de 100 questions, répartis la difficulté comme suit :
   - 40 questions « Facile » (accessible au grand public)
   - 40 questions « Moyen » (nécessite une bonne culture du sujet)
   - 20 questions « Difficile » (questions pointues et pièges experts)

2. **Format des questions** :
   - Exactement 4 choix possibles par question (`choices`).
   - Une seule réponse correcte indiquée par son index (`correctIndex`, entier de 0 à 3).
   - Les propositions incorrectes doivent être plausibles (éviter les choix absurdes).
   - Aucun doublon de question ou de concept redondant.
   - Respect strict de l'orthographe française, de la grammaire et de la typographie (accords vérifiés, guillemets français « », espaces insécables devant les deux-points et points d'interrogation).

3. **Format de sortie (JSON brut valide uniquement, sans texte avant ni après)** :

```json
[
  {
    "id": "cg-001",
    "theme": "Culture générale",
    "difficulty": "Facile",
    "prompt": "Quelle est la capitale de l'Australie ?",
    "choices": ["Sydney", "Melbourne", "Canberra", "Perth"],
    "correctIndex": 2
  }
]
```
