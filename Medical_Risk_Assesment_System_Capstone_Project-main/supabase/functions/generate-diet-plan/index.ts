// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Generate Diet Plan Function")

serve(async (req: Request) => {
  const { url, method } = req

  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    })
  }

  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    // Get the request body
    const { assessmentId, userId } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get assessment data if provided
    let assessmentData = null
    if (assessmentId) {
      const { data, error } = await supabaseClient
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single()

      if (error) throw error
      assessmentData = data
    }

    const getStaticDietPlan = (assessmentType: string, riskLevel: string) => {
      const plans = {
        heart: {
          low: `# ❤️ Heart-Healthy Indian Diet Plan (Low Risk)

## 🍽️ Today's Meal Plan - DASH Diet Focus

### 🌅 Breakfast
**🥣 Oatmeal with banana & almonds**
- *Why it helps:* Fiber-rich oats lower cholesterol, banana provides potassium for blood pressure control, almonds offer heart-healthy fats
- *Risk reduction:* Reduces LDL cholesterol by 10-15% when consumed regularly

### 🍽️ Lunch
**🍛 Vegetable biryani with cucumber raita**
- *Why it helps:* Mixed vegetables provide antioxidants, brown rice offers complex carbs, yogurt contains probiotics
- *Risk reduction:* Antioxidants protect blood vessels, potassium helps regulate blood pressure

### 🍽️ Dinner
**🐟 Grilled fish with mixed vegetables**
- *Why it helps:* Omega-3 fatty acids reduce inflammation, vegetables provide fiber and vitamins
- *Risk reduction:* Omega-3s lower triglyceride levels and reduce heart disease risk by 20%

### 🍎 Snacks
**🍎 Apple slices + 🥜 handful of walnuts**
- *Why it helps:* Apples contain soluble fiber, walnuts provide healthy fats and antioxidants
- *Risk reduction:* Daily nut consumption reduces heart disease risk by 30%

💡 **Key Benefits:** This plan emphasizes potassium-rich foods, healthy fats, and antioxidants that work together to maintain healthy blood pressure and cholesterol levels. Focus on whole grains and limit processed foods.

⚠️ **Remember:** Stay hydrated, limit salt intake, and consult your cardiologist for personalized advice.`,

          medium: `# 💙 Heart Disease Management Plan (Medium Risk)

## 🍽️ Today's Meal Plan - Sodium & Cholesterol Control

### 🌅 Breakfast
**🥥 Idli with tomato chutney (no added salt)**
- *Why it helps:* Steamed preparation reduces fat content, tomatoes provide lycopene
- *Risk reduction:* Low-sodium preparation helps control blood pressure

### 🍽️ Lunch
**🍛 Moong dal khichdi with vegetables**
- *Why it helps:* Easy-to-digest lentils provide plant protein, vegetables add fiber
- *Risk reduction:* Plant-based proteins help manage cholesterol levels

### 🍽️ Dinner
**🍗 Chicken stew with leafy greens**
- *Why it helps:* Lean protein without excess fat, greens provide magnesium and potassium
- *Risk reduction:* Magnesium supports heart muscle function, potassium regulates blood pressure

### 🍎 Snacks
**🍊 Orange + 🥛 low-fat yogurt**
- *Why it helps:* Vitamin C from oranges, calcium and probiotics from yogurt
- *Risk reduction:* Vitamin C protects blood vessels, calcium supports heart rhythm

💡 **Key Benefits:** This moderate-risk plan focuses on sodium restriction (1500mg/day), increased potassium intake, and omega-3 sources to manage existing heart conditions.

⚠️ **Monitor:** Track your blood pressure daily and report any symptoms to your healthcare provider.`,

          high: `# 💜 Cardiac Care Diet Plan (High Risk)

## 🍽️ Today's Meal Plan - Therapeutic Nutrition

### 🌅 Breakfast
**🥣 Oatmeal with flaxseeds (unsweetened)**
- *Why it helps:* Soluble fiber binds cholesterol, flaxseeds provide omega-3s
- *Risk reduction:* Reduces LDL cholesterol and inflammation in blood vessels

### 🍽️ Lunch
**🍛 Vegetable stir-fry with minimal oil + brown rice**
- *Why it helps:* Vegetables provide antioxidants, controlled portions prevent weight gain
- *Risk reduction:* Antioxidants protect against plaque buildup

### 🍽️ Dinner
**🐟 Baked fish with herbs (no salt)**
- *Why it helps:* Omega-3s reduce inflammation, herbs add flavor without sodium
- *Risk reduction:* Anti-inflammatory effects protect heart tissue

### 🍎 Snacks
**🍎 Small apple + 🥜 5-6 almonds**
- *Why it helps:* Controlled portions, healthy fats in moderation
- *Risk reduction:* Prevents blood sugar spikes that stress the heart

💡 **Critical Focus:** Very low sodium (1000mg/day), controlled calories, herbs instead of salt, daily monitoring.

⚠️ **Emergency:** Call emergency services if you experience chest pain, shortness of breath, or dizziness. Medication adherence is crucial.`,

        },

        diabetes: {
          low: `# 🟢 Diabetes Prevention Plan (Low Risk)

## 🍽️ Today's Meal Plan - Glycemic Control

### 🌅 Breakfast
**🥥 Idli with sambar (3 pieces)**
- *Why it helps:* Complex carbohydrates digest slowly, protein from lentils
- *Risk reduction:* Prevents blood sugar spikes, maintains steady energy

### 🍽️ Lunch
**🍛 Mixed vegetable curry with roti**
- *Why it helps:* High fiber vegetables, whole wheat roti provides complex carbs
- *Risk reduction:* Fiber slows sugar absorption, prevents insulin resistance

### 🍽️ Dinner
**🍗 Grilled chicken with salad**
- *Why it helps:* Lean protein, vegetables provide nutrients without carbs
- *Risk reduction:* Balanced meal prevents nighttime blood sugar fluctuations

### 🍎 Snacks
**🥕 Carrot sticks with hummus**
- *Why it helps:* Low glycemic vegetables, chickpeas provide protein
- *Risk reduction:* Stable blood sugar between meals

💡 **Key Benefits:** Focus on low GI foods, balanced meals, and regular timing to maintain healthy blood sugar levels.

⚠️ **Monitor:** Check blood sugar occasionally and maintain healthy weight.`,

          medium: `# 🟡 Prediabetes Management Plan (Medium Risk)

## 🍽️ Today's Meal Plan - Blood Sugar Control

### 🌅 Breakfast
**🥣 Dalia with vegetables**
- *Why it helps:* Complex carbs from broken wheat, high fiber content
- *Risk reduction:* Slow digestion prevents blood sugar spikes

### 🍽️ Lunch
**🍛 Palak paneer with brown rice**
- *Why it helps:* Spinach provides magnesium, paneer offers protein, brown rice has fiber
- *Risk reduction:* Magnesium improves insulin sensitivity

### 🍽️ Dinner
**🐟 Fish curry with mixed vegetables**
- *Why it helps:* Omega-3s reduce inflammation, vegetables add fiber
- *Risk reduction:* Anti-inflammatory effects help manage insulin resistance

### 🍎 Snacks
**🍎 Apple + 🥛 yogurt**
- *Why it helps:* Moderate fruit portion, protein from dairy
- *Risk reduction:* Balanced snack prevents hypoglycemia

💡 **Key Benefits:** Carbohydrate counting, consistent meal timing, and weight management to reverse prediabetes.

⚠️ **Track:** Monitor blood sugar 2-3 times weekly and report trends to your doctor.`,

          high: `# 🔴 Diabetic Diet Plan (High Risk)

## 🍽️ Today's Meal Plan - Precise Blood Sugar Management

### 🌅 Breakfast
**🥣 Methi paratha (1 small) with yogurt**
- *Why it helps:* Fenugreek reduces blood sugar, yogurt provides protein
- *Risk reduction:* Natural blood sugar lowering compounds

### 🍽️ Lunch
**🍛 Bitter gourd sabzi with roti**
- *Why it helps:* Bitter gourd contains charantin that lowers blood sugar
- *Risk reduction:* Natural insulin-mimetic effects

### 🍽️ Dinner
**🍗 Grilled chicken with leafy greens**
- *Why it helps:* Lean protein, greens provide nutrients without carbs
- *Risk reduction:* Prevents blood sugar fluctuations

### 🍎 Snacks
**🥜 Handful of almonds + 🥕 celery sticks**
- *Why it helps:* Healthy fats, low-carb vegetables
- *Risk reduction:* Prevents blood sugar crashes

💡 **Critical Focus:** Blood sugar monitoring before/after meals, carb counting, diabetic-friendly recipes.

⚠️ **Medical Alert:** Regular HbA1c testing, medication compliance, immediate medical attention for hypo/hyperglycemia.`,

        },

        stroke: {
          low: `# 🧠 Stroke Prevention Plan (Low Risk)

## 🍽️ Today's Meal Plan - Brain Health Focus

### 🌅 Breakfast
**🥣 Oatmeal with walnuts**
- *Why it helps:* Omega-3s support brain health, fiber aids digestion
- *Risk reduction:* Omega-3s reduce blood clot formation risk

### 🍽️ Lunch
**🍛 Vegetable biryani with raita**
- *Why it helps:* Antioxidants from vegetables protect brain cells
- *Risk reduction:* Anti-inflammatory compounds reduce stroke risk

### 🍽️ Dinner
**🐟 Fish curry with turmeric**
- *Why it helps:* Omega-3s and curcumin reduce inflammation
- *Risk reduction:* Curcumin protects blood vessels in the brain

### 🍎 Snacks
**🍊 Orange + 🥜 walnuts**
- *Why it helps:* Vitamin C protects blood vessels, healthy fats for brain
- *Risk reduction:* Vitamin C prevents plaque buildup

💡 **Key Benefits:** Mediterranean-style eating with emphasis on brain-protective nutrients and blood pressure control.

⚠️ **Maintain:** Regular exercise, stress management, and healthy sleep patterns.`,

          medium: `# 🟠 Stroke Risk Reduction Plan (Medium Risk)

## 🍽️ Today's Meal Plan - Hypertension Management

### 🌅 Breakfast
**🥥 Upma with vegetables**
- *Why it helps:* Whole grains provide steady energy, veggies add potassium
- *Risk reduction:* Potassium helps control blood pressure

### 🍽️ Lunch
**🍛 Dal tadka with rice and cucumber**
- *Why it helps:* Plant protein, vegetables provide hydration and nutrients
- *Risk reduction:* Plant-based diet reduces hypertension risk

### 🍽️ Dinner
**🍗 Chicken stir-fry with broccoli**
- *Why it helps:* Lean protein, cruciferous vegetables provide antioxidants
- *Risk reduction:* Antioxidants protect blood vessel integrity

### 🍎 Snacks
**🍌 Banana + 🥛 yogurt**
- *Why it helps:* Potassium from banana, calcium from yogurt
- *Risk reduction:* Potassium-magnesium balance regulates blood pressure

💡 **Key Benefits:** Low sodium emphasis, increased potassium-rich foods, anti-inflammatory spices.

⚠️ **Monitor:** Blood pressure twice daily, report any neurological symptoms immediately.`,

          high: `# 🔴 Stroke Rehabilitation Plan (High Risk)

## 🍽️ Today's Meal Plan - Neuroprotection Focus

### 🌅 Breakfast
**🥣 Oatmeal with turmeric and ginger**
- *Why it helps:* Anti-inflammatory spices protect brain tissue
- *Risk reduction:* Curcumin and ginger reduce neuroinflammation

### 🍽️ Lunch
**🍛 Vegetable stir-fry with garlic**
- *Why it helps:* Garlic provides allicin, vegetables offer antioxidants
- *Risk reduction:* Allicin prevents blood clots, antioxidants protect neurons

### 🍽️ Dinner
**🐟 Salmon with leafy greens**
- *Why it helps:* High omega-3 content, greens provide brain-supporting nutrients
- *Risk reduction:* Omega-3s improve cerebral blood flow

### 🍎 Snacks
**🍓 Berries + 🥜 almonds**
- *Why it helps:* Anthocyanins cross blood-brain barrier, healthy fats support myelin
- *Risk reduction:* Berries improve cognitive function, almonds provide vitamin E

💡 **Critical Focus:** Anti-inflammatory foods, omega-3 rich choices, blood pressure control, regular neurological monitoring.

⚠️ **Emergency Signs:** Sudden weakness, confusion, severe headache, vision changes - call emergency immediately.`,

        },

        kidney: {
          low: `# 🟦 Kidney Health Diet Plan (Low Risk)

## 🍽️ Today's Meal Plan - Kidney Function Support

### 🌅 Breakfast
**🥣 Oatmeal with apple**
- *Why it helps:* Fiber supports digestion, low-potassium fruit
- *Risk reduction:* Maintains healthy kidney filtration

### 🍽️ Lunch
**🍛 Vegetable biryani with raita**
- *Why it helps:* Controlled portions, vegetables provide nutrients
- *Risk reduction:* Balanced nutrients without stressing kidneys

### 🍽️ Dinner
**🐟 Fish curry with cabbage**
- *Why it helps:* Lean protein, low-potassium vegetable
- *Risk reduction:* Appropriate protein intake for kidney health

### 🍎 Snacks
**🍎 Apple + 🥛 yogurt**
- *Why it helps:* Low-potassium choices, calcium from dairy
- *Risk reduction:* Prevents mineral imbalances

💡 **Key Benefits:** Hydration focus, balanced protein, controlled phosphorus and potassium.

⚠️ **Maintain:** Regular kidney function tests, stay well-hydrated.`,

          medium: `# 🟨 Kidney Protection Diet Plan (Medium Risk)

## 🍽️ Today's Meal Plan - Protein & Fluid Management

### 🌅 Breakfast
**🥥 Upma with cabbage**
- *Why it helps:* Low-potassium vegetable, moderate protein
- *Risk reduction:* Prevents potassium overload

### 🍽️ Lunch
**🍛 Moong dal khichdi**
- *Why it helps:* Easy-to-digest lentils, controlled portions
- *Risk reduction:* Moderate protein prevents kidney strain

### 🍽️ Dinner
**🍗 Chicken with cauliflower**
- *Why it helps:* Lean protein, low-potassium vegetable
- *Risk reduction:* Balanced nutrients for kidney protection

### 🍎 Snacks
**🍊 Orange + 🥜 limited nuts**
- *Why it helps:* Vitamin C, controlled phosphorus
- *Risk reduction:* Prevents mineral accumulation

💡 **Key Benefits:** Protein restriction, phosphorus control, fluid balance management.

⚠️ **Monitor:** Regular blood tests, report swelling or fatigue.`,

          high: `# 🟥 Advanced Renal Diet Plan (High Risk)

## 🍽️ Today's Meal Plan - Dialysis Preparation

### 🌅 Breakfast
**🥣 Oatmeal with apple**
- *Why it helps:* Low-potassium, easy to digest
- *Risk reduction:* Prevents electrolyte imbalances

### 🍽️ Lunch
**🍛 Vegetable stir-fry (cabbage, cauliflower)**
- *Why it helps:* Very low-potassium vegetables
- *Risk reduction:* Prevents hyperkalemia

### 🍽️ Dinner
**🍗 Small portion chicken with rice**
- *Why it helps:* Controlled protein, simple carbs
- *Risk reduction:* Prevents uremia buildup

### 🍎 Snacks
**🍎 Small apple + 🥛 limited yogurt**
- *Why it helps:* Controlled portions, calcium
- *Risk reduction:* Prevents phosphorus overload

💡 **Critical Focus:** Strict potassium/phosphorus control, fluid restrictions, dialysis preparation.

⚠️ **Medical Emergency:** Severe fatigue, confusion, chest pain - seek immediate care.`,

        },

        general: {
          low: `# 🌱 General Wellness Diet Plan (Low Risk)

## 🍽️ Today's Meal Plan - Overall Health

### 🌅 Breakfast
**🥣 Oatmeal with banana and almonds**
- *Why it helps:* Complete nutrition, sustained energy
- *Risk reduction:* Balanced nutrients prevent deficiencies

### 🍽️ Lunch
**🍛 Vegetable biryani with raita**
- *Why it helps:* Mixed nutrients, probiotics from yogurt
- *Risk reduction:* Comprehensive nutrition supports immunity

### 🍽️ Dinner
**🐟 Fish curry with vegetables**
- *Why it helps:* Omega-3s, complete proteins, vitamins
- *Risk reduction:* Anti-inflammatory benefits

### 🍎 Snacks
**🍎 Fruit salad + 🥜 nuts**
- *Why it helps:* Natural sugars, healthy fats
- *Risk reduction:* Prevents energy crashes

💡 **Key Benefits:** Balanced macronutrients, variety, nutrient density.

⚠️ **Maintain:** Regular health checkups, healthy lifestyle.`,

          medium: `# ⚖️ Health Optimization Diet Plan (Medium Risk)

## 🍽️ Today's Meal Plan - Balanced Wellness

### 🌅 Breakfast
**🥥 Idli with sambar**
- *Why it helps:* Fermented foods, complex carbs
- *Risk reduction:* Gut health supports overall wellness

### 🍽️ Lunch
**🍛 Mixed vegetable curry with roti**
- *Why it helps:* Plant-based nutrients, fiber
- *Risk reduction:* Antioxidants reduce chronic disease risk

### 🍽️ Dinner
**🍗 Grilled chicken with salad**
- *Why it helps:* Lean protein, vegetables
- *Risk reduction:* Balanced meal prevents deficiencies

### 🍎 Snacks
**🥕 Carrots + 🥛 yogurt**
- *Why it helps:* Beta-carotene, probiotics
- *Risk reduction:* Nutrient synergy

💡 **Key Benefits:** Portion control, nutrient balance, healthy habits.

⚠️ **Monitor:** Weight, energy levels, sleep quality.`,

          high: `# 🏥 Comprehensive Health Diet Plan (High Risk)

## 🍽️ Today's Meal Plan - Therapeutic Nutrition

### 🌅 Breakfast
**🥣 Dalia with vegetables**
- *Why it helps:* Easy digestion, nutrient absorption
- *Risk reduction:* Gentle on digestive system

### 🍽️ Lunch
**🍛 Dal tadka with rice**
- *Why it helps:* Plant protein, complete carbs
- *Risk reduction:* Balanced nutrients for recovery

### 🍽️ Dinner
**🐟 Baked fish with greens**
- *Why it helps:* Anti-inflammatory, nutrient-dense
- *Risk reduction:* Supports healing processes

### 🍎 Snacks
**🍊 Citrus + 🥜 almonds**
- *Why it helps:* Vitamin C, healthy fats
- *Risk reduction:* Immune support, anti-inflammatory

💡 **Critical Focus:** Medical supervision, nutrient optimization, gradual improvements.

⚠️ **Emergency:** Any severe symptoms require immediate medical attention.`,

        }
      };

      const assessmentType = assessmentData?.assessment_type || 'general';
      const riskLevel = assessmentData?.risk_level || 'medium';

      return plans[assessmentType]?.[riskLevel] || plans.general.medium;
    };

    const planContent = getStaticDietPlan(assessmentData?.assessment_type, assessmentData?.risk_level);

    // Save to database
    const riskType = assessmentData ? assessmentData.risk_level : 'general'
    const { data, error } = await supabaseClient
      .from('diet_plans')
      .insert({
        user_id: userId,
        assessment_id: assessmentId || null,
        plan_content: planContent,
        risk_type: riskType,
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
