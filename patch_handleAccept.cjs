const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldCode = `  const handleAcceptAuditChange = () => {
    if (!selectedRecipe || !auditModifiedRecipe) return;
    
    // Create a copy of the selected recipe
    const stampedRecipe = { 
      ...selectedRecipe, 
      updatedAt: new Date().toISOString() 
    };
    
    // Apply only the accepted items (metadata/params, ingredients, instructions)
    if (acceptAuditParams) {
      stampedRecipe.summary = auditModifiedRecipe.summary;
      stampedRecipe.cookingTime = auditModifiedRecipe.cookingTime;
      if (auditModifiedRecipe.estimatedCookingTime) {
        stampedRecipe.estimatedCookingTime = auditModifiedRecipe.estimatedCookingTime;
      }
      stampedRecipe.difficulty = auditModifiedRecipe.difficulty;
      stampedRecipe.applianceType = auditModifiedRecipe.applianceType;
      stampedRecipe.applianceTips = auditModifiedRecipe.applianceTips;
      stampedRecipe.expertJustification = auditModifiedRecipe.expertJustification;
      if (auditModifiedRecipe.category) {
        stampedRecipe.category = auditModifiedRecipe.category;
      }
    }

    if (acceptAuditIngredients) {
      stampedRecipe.ingredients = [...auditModifiedRecipe.ingredients];
    }

    if (acceptAuditInstructions) {
      stampedRecipe.instructions = [...auditModifiedRecipe.instructions];
    }

    // Replace recipe with the modified one
    const updatedRecipesList = recipes.map(r => r.id === selectedRecipe.id ? stampedRecipe : r);
    saveRecipesToStorage(updatedRecipesList, stampedRecipe);
    setSelectedRecipe(stampedRecipe);
    
    // Clear audit panel state after accepting
    setAuditSteps(null);
    setProposedChange(null);
    setAuditModifiedRecipe(null);
    setActiveStepIndex(-1);
  };`;

const newCode = `  const handleAcceptAuditChange = () => {
    if (!selectedRecipe || !auditModifiedRecipe) return;
    
    if (isEditing) {
      if (acceptAuditParams) {
        setEditSummary(auditModifiedRecipe.summary || "");
        setEditCookingTime(auditModifiedRecipe.cookingTime || "");
        setEditEstimatedCookingTime(auditModifiedRecipe.estimatedCookingTime || "");
        setEditDifficulty(auditModifiedRecipe.difficulty || "Střední");
        setEditApplianceType(auditModifiedRecipe.applianceType || "");
        setEditApplianceTips(auditModifiedRecipe.applianceTips || "");
        setEditExpertJustification(auditModifiedRecipe.expertJustification || "");
        setEditCategory(auditModifiedRecipe.category || editCategory);
      }
      if (acceptAuditIngredients) {
        setEditIngredientsText(auditModifiedRecipe.ingredients.join("\\n"));
      }
      if (acceptAuditInstructions) {
        setEditInstructionsText(auditModifiedRecipe.instructions.join("\\n"));
      }
    } else {
      // Create a copy of the selected recipe
      const stampedRecipe = { 
        ...selectedRecipe, 
        updatedAt: new Date().toISOString() 
      };
      
      // Apply only the accepted items (metadata/params, ingredients, instructions)
      if (acceptAuditParams) {
        stampedRecipe.summary = auditModifiedRecipe.summary;
        stampedRecipe.cookingTime = auditModifiedRecipe.cookingTime;
        if (auditModifiedRecipe.estimatedCookingTime) {
          stampedRecipe.estimatedCookingTime = auditModifiedRecipe.estimatedCookingTime;
        }
        stampedRecipe.difficulty = auditModifiedRecipe.difficulty;
        stampedRecipe.applianceType = auditModifiedRecipe.applianceType;
        stampedRecipe.applianceTips = auditModifiedRecipe.applianceTips;
        stampedRecipe.expertJustification = auditModifiedRecipe.expertJustification;
        if (auditModifiedRecipe.category) {
          stampedRecipe.category = auditModifiedRecipe.category;
        }
      }
  
      if (acceptAuditIngredients) {
        stampedRecipe.ingredients = [...auditModifiedRecipe.ingredients];
      }
  
      if (acceptAuditInstructions) {
        stampedRecipe.instructions = [...auditModifiedRecipe.instructions];
      }
  
      // Replace recipe with the modified one
      const updatedRecipesList = recipes.map(r => r.id === selectedRecipe.id ? stampedRecipe : r);
      saveRecipesToStorage(updatedRecipesList, stampedRecipe);
      setSelectedRecipe(stampedRecipe);
    }
    
    // Clear audit panel state after accepting
    setAuditSteps(null);
    setProposedChange(null);
    setAuditModifiedRecipe(null);
    setActiveStepIndex(-1);
  };`;

if (content.includes('const updatedRecipesList = recipes.map(r => r.id === selectedRecipe.id ? stampedRecipe : r);')) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Patched handleAcceptAuditChange");
} else {
  console.log("Could not find block to replace");
}
