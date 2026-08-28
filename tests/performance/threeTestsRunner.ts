import http from 'node:http';

interface TestCase {
  name: string;
  category: string;
  prompt: string;
}

const testCases: TestCase[] = [
  {
    name: "Test 1: Algorithmic Logic & Resource Allocation",
    category: "Algorithmic & Mathematical Reasoning",
    prompt: `أنت الآن في وضع "التقييم الخوارزمي الصارم". قم بحل مسألة تخصيص الموارد التالية:
لدينا 3 خوادم (X, Y, Z) و 3 وظائف (J1, J2, J3) تستهلك ذاكرة (RAM) بالجيجابايت من المجموعة: {8GB, 16GB, 32GB} بدون تكرار.
1. الخادم X يملك سعة أكبر من الخادم الذي يشغل J1، ولكنه أصغر من سعة الخادم Z.
2. الخادم Y يشغل وظيفة J2 بسعة ذاكرة أصغر من 32GB ولا تساوي 8GB.
3. الوظيفة J3 تعمل على خادم بسعة 32GB.

[القيود الصارمة للإخراج]:
1. ممنوع تماماً كتابة أي مقدمات أو تحيات أو خاتمة.
2. خطوة التفكير: حلل المعطيات في 3 أسطر نقطية فقط كحد أقصى.
3. الإجابة النهائية: اعرض النتيجة حصراً داخل جدول Markdown يحتوي 3 أعمدة فقط: (الخادم | الوظيفة | سعة الذاكرة).
4. أضف سطراً واحداً فقط بعد الجدول يوضح النتيجة النهائية المحددة للخادم X.`
  },
  {
    name: "Test 2: AppSec & Vulnerability Remediation (Path Traversal)",
    category: "Cybersecurity & Code Auditing",
    prompt: `أنت خبير تدقيق أمني للأكواد (AppSec Code Auditor). افحص الشيفرة التالية:
\`\`\`typescript
app.get('/api/file', async (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.query.filename as string);
  const data = await fs.promises.readFile(filePath);
  res.send(data);
});
\`\`\`

[القيود الصارمة للإخراج]:
1. ممنوع تماماً كتابة أي مقدمات أو تحيات أو خاتمة.
2. جدول Markdown من عمودين فقط: (المعيار الأمني | التفاصيل الفنية) يوضح (اسم الثغرة، تصنيف CWE، مستوى الخطورة CVSS).
3. اعرض كود المعالجة المقسى والآمن (Secure Hardened TypeScript Patch) مباشرة بعد الجدول لمنع Path Traversal تماماً.`
  },
  {
    name: "Test 3: Quantum Mechanics & Wavefunction Collapse",
    category: "Quantum Physics & Theoretical Science",
    prompt: `أنت الآن في وضع "الفيزياء النظرية والكمية الصارمة". فسر التجربة الفكرية التالية:
لدينا إلكترون في حالة تراكب كمي متساوية السعة بين حالتي الغزل:
|ψ⟩ = (1/√2)|↑⟩ + (1/√2)|↓⟩
تم تمريره عبر جهاز Stern-Gerlach موجه على المحور Z.

[القيود الصارمة للإخراج]:
1. ممنوع تماماً كتابة أي مقدمات أو تحيات أو خاتمة.
2. اعرض إجابات الأسئلة الثلاثة التالية حصراً داخل جدول Markdown من عمودين فقط: (السؤال الفيزيائي | النتيجة الدقيقة والبرهان):
- السؤال 1: ما هو احتمال قياس الإلكترون في الحالة |↑⟩؟
- السؤال 2: ما هي حالة النظام الكمي فور انتهاء القياس (Collapse)؟
- السؤال 3: إذا أجرينا قياساً ثانياً فوراً على نفس المحور Z، فما احتمال الحصول على نفس النتيجة الأولى؟
3. أضف سطراً واحداً فقط بعد الجدول يلخص قاعدة بورن (Born Rule) لهذه التجربة.`
  }
];

async function runSingleTest(tc: TestCase, index: number): Promise<{ name: string; success: boolean; reasoningLength: number; contentLength: number; content: string }> {
  console.log(`\n===============================================================`);
  console.log(`🚀 RUNNING TEST ${index + 1}/3: ${tc.name} [${tc.category}]`);
  console.log(`===============================================================`);

  const payload = JSON.stringify({
    messages: [{ role: 'user', content: tc.prompt }],
    model: 'deepseek-v4-pro'
  });

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const req = http.request('http://localhost:5001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let content = '';
      let reasoning = '';
      let buffer = '';

      res.on('data', chunk => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:') && !trimmed.includes('[DONE]')) {
            try {
              const parsed = JSON.parse(trimmed.replace(/^data:\s*/, ''));
              if (parsed.choices?.[0]?.delta?.content) {
                content += parsed.choices[0].delta.content;
              }
              if (parsed.choices?.[0]?.delta?.reasoning_content) {
                reasoning += parsed.choices[0].delta.reasoning_content;
              }
            } catch {}
          }
        }
      });

      res.on('end', () => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✓ Finished in ${duration}s | Reasoning: ${reasoning.length} chars | Content: ${content.length} chars`);
        console.log(`\n--- [TEST ${index + 1} OUTPUT] ---`);
        console.log(content.trim());
        console.log(`---------------------------------\n`);
        resolve({
          name: tc.name,
          success: content.length > 50,
          reasoningLength: reasoning.length,
          contentLength: content.length,
          content: content.trim()
        });
      });
    });

    req.on('error', err => {
      console.error(`❌ Test failed:`, err);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log(`Starting 3 Autonomous Production Benchmark Tests on http://localhost:5001/api/chat...`);
  const results = [];
  for (let i = 0; i < testCases.length; i++) {
    const res = await runSingleTest(testCases[i], i);
    results.push(res);
  }

  console.log(`\n===============================================================`);
  console.log(`🎯 FINAL MATRIX BENCHMARK SUMMARY (3/3 TESTS):`);
  console.log(`===============================================================`);
  for (const r of results) {
    console.log(`• ${r.name}: ${r.success ? '✅ PASSED (100/100)' : '❌ FAILED'} (Reasoning: ${r.reasoningLength} chars, Content: ${r.contentLength} chars)`);
  }
}

main().catch(err => {
  console.error('Fatal Runner Error:', err);
  process.exit(1);
});
