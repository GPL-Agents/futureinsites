(function () {
  const neutral = { role: [33.3333, 33.3333, 33.3333], conversion: 50, care: [25, 25, 25, 25] };
  const variables = [
    { key: "relationship", label: "Inquirer's relationship to future resident", source: "form", weights: [10,4,2,5,2], options: [
      ["Self",90,5,5,45,50,30,10,10], ["Spouse or partner",80,5,15,55,35,35,15,15], ["Adult child",5,90,5,70,15,40,30,15], ["Other family member",5,25,70,55,15,40,30,15], ["Friend or neighbor",10,10,80,35,30,40,20,10], ["Professional (discharge planner, social worker, physician, care manager)",5,10,85,65,5,35,30,30] ] },
    { key: "initiated", label: "Who initiated the search", source: "form", weights: [2,10,4,3,2], options: [
      ["Future resident",90,5,5,50,60,25,5,10], ["Adult child",5,90,5,60,15,40,30,15], ["Other family member",5,20,75,50,15,40,30,15], ["Professional or physician",5,10,85,65,5,35,30,30] ] },
    { key: "pays", label: "Who pays", source: "manual", weights: [0,3,8,0,0], options: [
      ["Resident's own funds",80,10,10,50,25,25,25,25], ["Adult child or children",5,85,10,50,25,25,25,25], ["Shared: resident and family",45,45,10,50,25,25,25,25], ["Trust, POA or other representative",20,30,50,50,25,25,25,25] ] },
    { key: "approval", label: "Who has final approval", source: "manual", weights: [0,4,10,3,2], options: [
      ["Future resident",90,5,5,50,55,30,5,10], ["Adult child",5,90,5,60,10,40,35,15], ["Resident and family jointly",50,45,5,60,35,40,15,10], ["POA or guardian",5,40,55,55,5,25,50,20] ] },
    { key: "careInterest", label: "Care level of interest (stated)", source: "form", weights: [3,6,4,4,8], options: [
      ["Independent living",75,20,5,40,85,10,2,3], ["Assisted living",30,60,10,60,10,75,10,5], ["Memory care",10,75,15,65,2,13,80,5], ["Skilled nursing or rehab",5,70,25,65,2,10,8,80], ["Respite or short stay",10,70,20,55,5,50,35,10], ["Not sure yet",35,50,15,40,25,40,20,15] ] },
    { key: "trigger", label: "Trigger for the search", source: "form", weights: [2,6,3,7,5], options: [
      ["Convenience, connection or purpose",80,15,5,35,85,10,2,3], ["Home maintenance challenges",70,25,5,40,75,20,2,3], ["Isolation or loss of a spouse",50,45,5,50,55,35,5,5], ["Caregiver burnout or safety concern",5,75,20,65,5,45,40,10], ["Fall, hospitalization or rehab stay",10,60,30,75,5,45,10,40], ["Cognitive change or dementia diagnosis",5,80,15,70,2,15,78,5] ] },
    { key: "timeline", label: "Move timeline", source: "form", weights: [0,0,0,10,0], options: [
      ["Within 30 days",33.3333,33.3333,33.3333,90,25,25,25,25], ["1 to 3 months",33.3333,33.3333,33.3333,75,25,25,25,25], ["3 to 6 months",33.3333,33.3333,33.3333,55,25,25,25,25], ["6 to 12 months",33.3333,33.3333,33.3333,35,25,25,25,25], ["Just researching",33.3333,33.3333,33.3333,20,25,25,25,25] ] },
    { key: "referral", label: "Referral source", source: "automatic", weights: [2,3,1,8,1], options: [
      ["Current resident",60,30,10,80,60,25,10,5], ["Family or friend",40,45,15,70,40,35,15,10], ["Professional referral",5,30,65,75,5,35,25,35], ["Benchmark event",70,20,10,55,70,20,5,5], ["Online search",35,55,10,50,25,25,25,25], ["Paid aggregator",20,70,10,35,15,45,30,10], ["Social media",45,45,10,40,45,35,15,5] ] },
    { key: "entryPage", label: "Website entry page", source: "automatic", weights: [4,3,1,3,5], options: [
      ["Memory care page",10,75,15,60,2,13,80,5], ["Assisted living page",30,60,10,55,10,75,10,5], ["Independent living or lifestyle page",70,25,5,45,80,15,2,3], ["Pricing or cost page",35,55,10,65,25,25,25,25], ["Events page",65,25,10,45,60,25,10,5], ["Respite page",10,70,20,55,5,50,35,10] ] },
    { key: "distance", label: "Distance to community (miles)", source: "manual", type: "number", weights: [0,0,0,10,0] },
    { key: "engagement", label: "Highest engagement so far", source: "automatic", weights: [0,0,0,9,0], options: [
      ["Toured",33.3333,33.3333,33.3333,90,25,25,25,25], ["Requested a tour",33.3333,33.3333,33.3333,80,25,25,25,25], ["Called the community",33.3333,33.3333,33.3333,65,25,25,25,25], ["Attended an event",33.3333,33.3333,33.3333,55,25,25,25,25], ["Submitted a form only",33.3333,33.3333,33.3333,40,25,25,25,25], ["Downloaded a guide",33.3333,33.3333,33.3333,35,25,25,25,25] ] },
    { key: "budget", label: "Monthly budget ($)", source: "manual", type: "number", weights: [0,0,0,10,0] },
    { key: "agreement", label: "Family agreement", source: "manual", weights: [0,4,4,6,1], options: [
      ["All agree",40,40,20,75,25,25,25,25], ["Some disagreement",30,50,20,35,25,25,25,25], ["Future resident resistant",5,85,10,30,10,40,40,10] ] },
    { key: "adls", label: "Help with daily activities (ADLs)", source: "manual", weights: [0,0,0,0,9], options: [
      ["None",33.3333,33.3333,33.3333,50,85,10,2,3], ["Some help (1 to 2 ADLs)",33.3333,33.3333,33.3333,50,15,70,10,5], ["Extensive help (3 or more ADLs)",33.3333,33.3333,33.3333,50,3,45,20,32] ] },
    { key: "memory", label: "Memory or cognitive concerns", source: "manual", weights: [0,0,0,0,9], options: [
      ["None",33.3333,33.3333,33.3333,50,55,35,2,8], ["Mild forgetfulness",33.3333,33.3333,33.3333,50,25,55,15,5], ["Diagnosed dementia or Alzheimer's",33.3333,33.3333,33.3333,50,2,13,80,5], ["Wandering or safety risk",33.3333,33.3333,33.3333,50,1,4,90,5] ] },
    { key: "medical", label: "Medical or nursing needs", source: "manual", weights: [0,0,0,0,9], options: [
      ["None",33.3333,33.3333,33.3333,50,60,30,5,5], ["Medication management",33.3333,33.3333,33.3333,50,15,70,10,5], ["Post-hospital rehab",33.3333,33.3333,33.3333,50,3,20,5,72], ["24/7 clinical or nursing care",33.3333,33.3333,33.3333,50,1,5,9,85] ] }
  ];

  const defaults = {
    neutralConversion: 50, hot: 70, warm: 50, highCoverage: .75, highMargin: 20, lowCoverage: .5, lowMargin: 10,
    distanceBuckets: [[0,5,5],[5,10,4],[10,20,3],[20,40,2],[40,null,1]],
    budgetBuckets: [[0,4000,1],[4000,5500,2],[5500,7000,3],[7000,8500,4],[8500,null,5]]
  };

  function controls() {
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem("benchmarkModelControls") || "{}"); } catch (e) {}
    return Object.assign({}, defaults, stored.settings || {});
  }

  function weightsFor(v) {
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem("benchmarkModelControls") || "{}"); } catch (e) {}
    return stored.weights && stored.weights[v.key] ? stored.weights[v.key] : v.weights;
  }

  function bucketScore(value, buckets) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    const hit = buckets.find(b => n >= b[0] && (b[1] === null || n < b[1]));
    return hit ? hit[2] : null;
  }

  function numericPoints(variable, value, settings) {
    const score = bucketScore(value, variable.key === "distance" ? settings.distanceBuckets : settings.budgetBuckets);
    if (score === null) return null;
    return [33.3333,33.3333,33.3333,(score - 1) * 25,25,25,25,25];
  }

  function calculate(values) {
    const settings = controls();
    const sums = [0,0,0,0,0,0,0,0];
    const weightTotals = [0,0,0,0,0];
    const knownWeights = [0,0,0,0,0];
    let knownCount = 0;
    variables.forEach(v => {
      const w = weightsFor(v).map(Number);
      w.forEach((n,i) => weightTotals[i] += n);
      const raw = values[v.key];
      let pts = null;
      if (v.type === "number" && raw !== "" && raw !== undefined && raw !== null) pts = numericPoints(v, raw, settings);
      else if (raw && raw !== "Unknown") pts = v.options.find(o => o[0] === raw);
      const known = Boolean(pts);
      if (known) { knownCount += 1; w.forEach((n,i) => knownWeights[i] += n); }
      const p = known ? pts.slice(1) : [neutral.role[0],neutral.role[1],neutral.role[2],settings.neutralConversion,25,25,25,25];
      sums[0] += w[0] * p[0]; sums[1] += w[0] * p[1]; sums[2] += w[0] * p[2];
      sums[3] += w[1] * p[0]; sums[4] += w[1] * p[1]; sums[5] += w[1] * p[2];
      sums[6] += w[2] * p[0];
      sums[7] += w[2] * p[1];
    });
    function roleResult(weightIndex, startIndex) {
      const total = weightTotals[weightIndex] || 1;
      let scores;
      if (weightIndex === 0) scores = [sums[0]/total, sums[1]/total, sums[2]/total];
      else if (weightIndex === 1) scores = [sums[3]/total, sums[4]/total, sums[5]/total];
      else {
        scores = [0,0,0];
        variables.forEach(v => {
          const w = weightsFor(v).map(Number)[2];
          const raw = values[v.key];
          let pts = v.type === "number" ? numericPoints(v, raw, settings) : v.options && v.options.find(o => o[0] === raw);
          pts = pts ? pts.slice(1) : [neutral.role[0],neutral.role[1],neutral.role[2],settings.neutralConversion,25,25,25,25];
          scores[0] += w*pts[0]; scores[1] += w*pts[1]; scores[2] += w*pts[2];
        });
        scores = scores.map(n => n/total);
      }
      const labels = ["Senior", "Adult Child", "Caregiver / Other"];
      const order = scores.map((n,i) => [n,i]).sort((a,b) => b[0]-a[0]);
      return { label: labels[order[0][1]], scores, margin: order[0][0]-order[1][0], coverage: knownWeights[weightIndex]/total };
    }
    let conversionSum = 0;
    let careSums = [0,0,0,0];
    variables.forEach(v => {
      const w = weightsFor(v).map(Number);
      const raw = values[v.key];
      let pts = v.type === "number" ? numericPoints(v, raw, settings) : v.options && v.options.find(o => o[0] === raw);
      pts = pts ? pts.slice(1) : [neutral.role[0],neutral.role[1],neutral.role[2],settings.neutralConversion,25,25,25,25];
      conversionSum += w[3]*pts[3];
      for (let i=0;i<4;i+=1) careSums[i] += w[4]*pts[4+i];
    });
    const conversion = conversionSum/(weightTotals[3]||1);
    const careScores = careSums.map(n => n/(weightTotals[4]||1));
    const careLabels = ["Independent Living","Assisted Living","Memory Care","Skilled Nursing"];
    const careOrder = careScores.map((n,i)=>[n,i]).sort((a,b)=>b[0]-a[0]);
    const distanceScore = bucketScore(values.distance, settings.distanceBuckets);
    const budgetScore = bucketScore(values.budget, settings.budgetBuckets);
    const capped = distanceScore === 1 || budgetScore === 1;
    return {
      searching: roleResult(0), driving: roleResult(1), deciding: roleResult(2),
      conversion: { score: conversion, tier: capped ? "Nurture" : conversion >= settings.hot ? "Hot" : conversion >= settings.warm ? "Warm" : "Nurture", coverage: knownWeights[3]/(weightTotals[3]||1), capped },
      care: { label: careLabels[careOrder[0][1]], scores: careScores, margin: careOrder[0][0]-careOrder[1][0], coverage: knownWeights[4]/(weightTotals[4]||1) },
      completion: knownCount/variables.length
    };
  }

  window.BenchmarkModel = { variables, defaults, controls, weightsFor, calculate };
})();
