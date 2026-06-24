import sys, json
def send(o): sys.stdout.write(json.dumps(o)+"\n"); sys.stdout.flush()
for line in sys.stdin:
    line=line.strip()
    if not line: continue
    try: m=json.loads(line)
    except Exception: continue
    i=m.get("id"); meth=m.get("method")
    if meth=="initialize":
        send({"jsonrpc":"2.0","id":i,"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"serverInfo":{"name":"example","version":"1.0.0"}}})
    elif meth=="tools/list":
        send({"jsonrpc":"2.0","id":i,"result":{"tools":[{"name":"echo","description":"Echo the input text back.","inputSchema":{"type":"object","properties":{"text":{"type":"string"}},"required":["text"]}}]}})
    elif meth=="tools/call":
        send({"jsonrpc":"2.0","id":i,"result":{"content":[{"type":"text","text":"echo"}]}})
    elif meth and meth.startswith("notifications/"): pass
    elif i is not None: send({"jsonrpc":"2.0","id":i,"result":{}})
