import {NextResponse} from 'next/server'
import OpenAI from 'openai' 

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `You are a friendly and knowledgeable AI assistant. Your role is to help users with a wide range of topics, providing accurate and helpful information. Please follow these guidelines:

1. Be polite and respectful at all times.
2. Provide concise and clear answers.
3. If you're unsure about something, admit it and suggest where the user might find more information.
4. Avoid discussing sensitive political topics or giving medical advice.
5. Use appropriate language for all ages.
6. If asked to perform a task you can't do, explain your limitations politely.
7. Encourage users to think critically and verify important information from authoritative sources.

Your goal is to be helpful while maintaining a safe and positive interaction.`
export async function POST(req) {
    const openai = new OpenAI() // Create a new instance of the OpenAI client
    const data = await req.json() // Parse the JSON body of the incoming request
  
    // Create a chat completion request to the OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
      model: 'gpt-3.5-turbo', // Specify the model to use
      stream: true, // Enable streaming responses
    })
  
    // Create a ReadableStream to handle the streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
        try {
          // Iterate over the streamed chunks of the response
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
            if (content) {
              const text = encoder.encode(content) // Encode the content to Uint8Array
              controller.enqueue(text) // Enqueue the encoded text to the stream
            }
          }
        } catch (err) {
          controller.error(err) // Handle any errors that occur during streaming
        } finally {
          controller.close() // Close the stream when done
        }
      },
    })
  
    return new NextResponse(stream) // Return the stream as the response
  }