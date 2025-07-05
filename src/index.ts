import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import winax from 'winax';
import fs from 'fs';
import path from 'path';

const server = new McpServer({
  name: "rhino-server",
  version: "1.0.0"
});

let rhinoInstance: any = null;

async function getRhinoInstance() {
  if (!rhinoInstance) {
    try {
      rhinoInstance = new winax.Object('Rhino.Application');
      rhinoInstance.Visible = true;
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error('Failed to create Rhino instance:', error);
      throw error;
    }
  }
  return rhinoInstance;
}

server.registerTool("rhino_execute", {
  title: "Execute RhinoPython Script",
  description: "Execute Python script that interacts with Rhino",
  inputSchema: { pythonScript: z.string() }
}, async ({ pythonScript }) => {
  try {
    const rhino = await getRhinoInstance();

    const tempDir = path.join(process.cwd(), "temp-scripts");
            
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const scriptFile = path.join(tempDir, `script_${Date.now()}.py`);
    fs.writeFileSync(scriptFile, pythonScript);
    
    const result = rhino.RunScript(`-_RunPythonScript "${scriptFile}"`, 0);
    
    setTimeout(() => {
        if (fs.existsSync(scriptFile)) {
            fs.unlinkSync(scriptFile);
        }
    }, 1000);
    
    return { 
      content: [{ 
        type: "text", 
        text: `Python script executed successfully.\nResult: ${result || 'Script completed'}`
      }] 
    };
  } catch (error: any) {
    return {
      content: [{
        type: "text",
        text: `Error executing Grasshopper script: ${error.message}`
      }]
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);