import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Generate Lifestyle Analysis Function")

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

    // Call Hugging Face API to generate lifestyle analysis
    const apiKey = Deno.env.get('HUGGINGFACE_API_KEY')
    if (!apiKey) throw new Error('Hugging Face API key not configured')

    const baseInstruction = "You are an expert health coach and lifestyle consultant. Create a detailed, personalized lifestyle analysis."
    let prompt = `[INST] ${baseInstruction} Generate a general lifestyle analysis with recommendations for exercise, sleep, stress management, and healthy daily habits. [/INST]`

    if (assessmentData) {
      const { assessment_type, risk_level } = assessmentData

      // Disease-specific prompts
      const diseasePrompts = {
        heart: {
          low: 'For someone with low heart disease risk, focus on preventive measures. Include moderate aerobic exercise, heart-healthy diet, stress reduction, and regular health monitoring.',
          medium: 'For medium heart disease risk, emphasize cardiovascular health. Include specific exercise guidelines, DASH diet principles, blood pressure management, and lifestyle modifications.',
          high: 'For high heart disease risk, provide comprehensive cardiac rehabilitation guidelines. Include supervised exercise programs, strict dietary restrictions, medication adherence, and emergency preparedness.'
        },
        diabetes: {
          low: 'For low diabetes risk, focus on prevention through healthy lifestyle. Include balanced exercise, glycemic control through diet, weight management, and regular screening.',
          medium: 'For medium diabetes risk, provide prediabetes management. Include structured exercise plans, carbohydrate counting, blood sugar monitoring, and lifestyle interventions.',
          high: 'For high diabetes risk, provide comprehensive diabetes management. Include intensive lifestyle changes, medication compliance, complication prevention, and regular medical follow-up.'
        },
        stroke: {
          low: 'For low stroke risk, emphasize prevention. Include cardiovascular exercise, healthy diet, blood pressure control, and lifestyle risk factor management.',
          medium: 'For medium stroke risk, provide stroke prevention strategies. Include targeted exercise, Mediterranean diet, hypertension management, and risk factor modification.',
          high: 'For high stroke risk, provide intensive stroke prevention. Include supervised rehabilitation, strict dietary control, medication management, and close medical monitoring.'
        },
        kidney: {
          low: 'For low kidney disease risk, focus on kidney health maintenance. Include hydration, balanced diet, blood pressure control, and regular kidney function tests.',
          medium: 'For medium kidney disease risk, provide kidney protection strategies. Include fluid management, low-sodium diet, blood pressure control, and nephrotoxic avoidance.',
          high: 'For high kidney disease risk, provide advanced kidney care guidelines. Include dialysis preparation, strict dietary restrictions, fluid limitations, and comprehensive medical management.'
        },
        general: {
          low: 'Provide general wellness recommendations for overall health improvement.',
          medium: 'Provide moderate lifestyle interventions for health optimization.',
          high: 'Provide comprehensive lifestyle changes for significant health improvement.'
        }
      }

      const diseasePrompt = diseasePrompts[assessment_type]?.[risk_level] || diseasePrompts.general[risk_level] || diseasePrompts.general.medium

      prompt = `[INST] ${baseInstruction} Generate a personalized lifestyle analysis for ${assessment_type} disease with ${risk_level} risk level. ${diseasePrompt} Include specific exercise recommendations, sleep optimization, stress management techniques, daily habits, and preventive measures. Structure the response with clear sections for each area. Provide detailed, actionable advice. [/INST]`
    }

    const analysisContent = `# Comprehensive Lifestyle Analysis for Optimal Health 🏃‍♂️

## Exercise Recommendations 💪

### Daily Physical Activity
Aim for at least 150 minutes of moderate-intensity aerobic activity or 75 minutes of vigorous-intensity activity each week, or a combination of both. Here's how to incorporate it into your routine:

1. **Morning Walk/Run**: Start your day with a 30-minute brisk walk in a nearby park. This helps boost metabolism and sets a positive tone for the day.

2. **Strength Training**: Include 2-3 sessions per week focusing on major muscle groups. Use bodyweight exercises like squats, push-ups, and planks - no gym required!

3. **Yoga or Stretching**: Practice 15-20 minutes of yoga daily. It improves flexibility, reduces stress, and enhances mental clarity. Try simple poses like downward dog, cat-cow, and child's pose.

4. **Household Activities**: Turn chores into exercise - gardening, cleaning, or playing with children can count toward your daily movement goals.

### Tips for Success
- Find activities you enjoy - whether it's dancing, cycling, or swimming
- Start small and gradually increase intensity
- Track your progress with a simple app or journal
- Include rest days to prevent burnout

## Sleep Optimization 😴

Quality sleep is crucial for overall health and disease prevention. Here's your personalized sleep plan:

### Sleep Schedule
- **Bedtime**: Aim for 10:00 PM - 11:00 PM
- **Wake Time**: 6:00 AM - 7:00 AM
- **Total Sleep**: 7-9 hours per night

### Sleep Hygiene Practices
1. **Consistent Routine**: Go to bed and wake up at the same time every day, even on weekends.

2. **Bedroom Environment**: Keep your bedroom cool (around 18-20°C), dark, and quiet. Use blackout curtains if needed.

3. **Pre-Sleep Ritual**: Create a calming routine 1 hour before bed:
   - Dim the lights
   - Avoid screens (blue light suppresses melatonin)
   - Read a book or practice deep breathing
   - Have a warm bath or herbal tea

4. **Diet and Sleep**: Avoid caffeine after 2 PM and heavy meals within 3 hours of bedtime.

### Common Sleep Issues Solutions
- **Difficulty Falling Asleep**: Try the 4-7-8 breathing technique (inhale for 4 seconds, hold for 7, exhale for 8)
- **Waking During Night**: Keep a notepad by your bed to write down worries instead of ruminating
- **Daytime Fatigue**: Ensure you're getting enough natural light during the day

## Stress Management Techniques 🧘‍♀️

Chronic stress can negatively impact your health. Here's how to manage it effectively:

### Daily Stress Busters
1. **Mindfulness Meditation**: Start with 5 minutes daily. Focus on your breath and observe thoughts without judgment. Apps like Headspace can guide you.

2. **Deep Breathing Exercises**: Practice diaphragmatic breathing - place one hand on your belly, inhale deeply through your nose for 4 counts, exhale through your mouth for 6 counts.

3. **Progressive Muscle Relaxation**: Tense and release muscle groups from your toes to your head. This reduces physical tension associated with stress.

4. **Nature Time**: Spend 20 minutes daily in nature - walk barefoot on grass, sit by a window with a view, or garden.

### Weekly Stress Management
- **Journaling**: Write down 3 things you're grateful for each evening
- **Social Connection**: Schedule regular calls with friends or family
- **Hobbies**: Dedicate time to activities you love - reading, music, art, or sports

### Stress Warning Signs
Watch for: irritability, fatigue, trouble concentrating, changes in appetite, or sleep disturbances. If these persist, consider speaking with a healthcare professional.

## Daily Healthy Habits 🌟

### Morning Routine
1. **Hydration**: Drink a glass of warm water with lemon upon waking to kickstart digestion
2. **Sunlight Exposure**: Get 10-15 minutes of morning sunlight to regulate your circadian rhythm
3. **Healthy Breakfast**: Choose nutrient-dense options like oatmeal with fruits, eggs with vegetables, or yogurt with nuts

### Afternoon Practices
1. **Movement Breaks**: Every hour, stand up, stretch, and walk around for 2-3 minutes
2. **Mindful Eating**: Eat without distractions, chew thoroughly, and listen to your body's hunger cues
3. **Short Walks**: Take a 10-minute walk after lunch to maintain energy levels

### Evening Wind-Down
1. **Digital Detox**: Put away screens 1 hour before bed
2. **Light Exercise**: Gentle stretching or walking to release endorphins
3. **Reflection**: Review your day - what went well? What can you improve tomorrow?

## Preventive Measures and Health Monitoring 🩺

### Regular Health Check-ups
- **Annual Physical**: Complete blood work, blood pressure, and BMI assessment
- **Disease-Specific Screening**: Based on your risk factors, schedule appropriate tests (e.g., cholesterol for heart health, HbA1c for diabetes)
- **Mental Health Check**: Monitor your emotional well-being and seek support if needed

### Lifestyle Tracking
- **Food Diary**: Track your meals for 1 week to identify patterns and areas for improvement
- **Activity Log**: Monitor your exercise and daily steps
- **Sleep Tracker**: Use a wearable device or app to track sleep quality
- **Stress Journal**: Note stressful events and your coping strategies

### Emergency Preparedness
- Know the signs of medical emergencies related to your health conditions
- Keep important phone numbers handy (doctor, emergency contacts)
- Have a basic first-aid kit at home

## Nutrition and Hydration Guidelines 🥗

### Balanced Eating
- **Portion Control**: Use smaller plates and listen to hunger/fullness cues
- **Colorful Plates**: Fill half your plate with vegetables, quarter with lean protein, quarter with whole grains
- **Meal Timing**: Eat every 3-4 hours to maintain stable energy levels

### Hydration Goals
- **Daily Water Intake**: Aim for 8-10 glasses (about 2-3 liters) of water daily
- **Hydration Cues**: Drink water with each meal and when you feel thirsty
- **Alternative Sources**: Herbal teas, infused water, and water-rich foods like cucumbers and watermelon

## Long-term Lifestyle Goals 🎯

### 3-Month Targets
1. Establish consistent sleep and exercise routines
2. Reduce processed food consumption by 50%
3. Build stress management techniques into daily life

### 6-Month Milestones
1. Achieve and maintain healthy weight range
2. Improve key health markers (blood pressure, cholesterol, etc.)
3. Develop resilience to stress and daily challenges

### 1-Year Vision
1. Make healthy living a natural part of your lifestyle
2. Inspire others in your family and community
3. Achieve optimal health and well-being

Remember, lifestyle changes take time and consistency. Start with small, achievable steps and build from there. Consult with healthcare professionals for personalized medical advice. You've got this! Stay committed to your health journey. 🌈`

    // Save to database
    const { data, error } = await supabaseClient
      .from('lifestyle_analyses')
      .insert({
        user_id: userId,
        analysis_content: analysisContent,
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
