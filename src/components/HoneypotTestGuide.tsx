
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, Shield, Bug, Database, FileText } from 'lucide-react';
import { AttackLogger } from '@/utils/attackLogger';

const HoneypotTestGuide = () => {
  const [testInput, setTestInput] = useState('');
  const [detectionResults, setDetectionResults] = useState<any[]>([]);
  const logger = AttackLogger.getInstance();

  const vulnerabilityTests = [
    {
      category: 'XSS (Cross-Site Scripting)',
      severity: 'high',
      tests: [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '"><script>alert("XSS")</script>',
        '<iframe src="javascript:alert(1)"></iframe>'
      ]
    },
    {
      category: 'SQL Injection',
      severity: 'critical',
      tests: [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "admin'--",
        "' OR 1=1 --",
        "1' OR '1'='1' /*"
      ]
    },
    {
      category: 'Path Traversal',
      severity: 'high',
      tests: [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '..%2f..%2f..%2fetc%2fpasswd'
      ]
    },
    {
      category: 'Command Injection',
      severity: 'critical',
      tests: [
        '; cat /etc/passwd',
        '| whoami',
        '`ls -la`',
        '$(whoami)',
        '; rm -rf /',
        '& netstat -an'
      ]
    },
    {
      category: 'LDAP Injection',
      severity: 'high',
      tests: [
        '*)',
        '(|',
        '(&',
        '(!',
        ')(',
        '*)(uid=*'
      ]
    }
  ];

  const backendVulnerabilities = [
    {
      endpoint: '/api/admin/search',
      method: 'GET',
      vulnerability: 'XSS Vulnerability',
      parameter: 'q',
      description: 'When vulnerable=true, renders unsanitized HTML',
      testPayload: '?q=<script>alert("XSS")</script>&vulnerable=true'
    },
    {
      endpoint: '/api/admin/users/:userId',
      method: 'GET',
      vulnerability: 'SQL Injection Simulation',
      parameter: 'userId',
      description: 'When direct_sql=true, simulates SQL injection',
      testPayload: "/1' OR '1'='1?direct_sql=true"
    },
    {
      endpoint: '/api/auth/login',
      method: 'POST',
      vulnerability: 'Password Logging',
      parameter: 'password',
      description: 'Intentionally logs password hints for analysis',
      testPayload: '{"email":"test@test.com","password":"admin123"}'
    },
    {
      endpoint: 'Any endpoint',
      method: 'ANY',
      vulnerability: 'Rate Limiting Bypass',
      parameter: 'Headers',
      description: 'Bypass rate limiting with admin headers',
      testPayload: 'x-admin-bypass: true'
    }
  ];

  const testVulnerability = (payload: string) => {
    const results: any[] = [];
    
    // Test XSS
    if (logger.detectXSS(payload, 'test_input')) {
      results.push({ type: 'XSS', detected: true });
    }
    
    // Test SQL Injection
    if (logger.detectSQLInjection(payload, 'test_input')) {
      results.push({ type: 'SQL Injection', detected: true });
    }
    
    // Test Path Traversal
    if (logger.detectPathTraversal(payload, 'test_input')) {
      results.push({ type: 'Path Traversal', detected: true });
    }
    
    // Test Command Injection
    if (logger.detectCommandInjection(payload, 'test_input')) {
      results.push({ type: 'Command Injection', detected: true });
    }
    
    // Test LDAP Injection
    if (logger.detectLDAPInjection(payload, 'test_input')) {
      results.push({ type: 'LDAP Injection', detected: true });
    }

    setDetectionResults(results);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-red-600">
              <Shield className="h-6 w-6 mr-2" />
              🍯 AIIMS Honeypot Testing Guide
            </CardTitle>
            <CardDescription>
              This is a controlled environment for testing web application vulnerabilities.
              <strong className="text-red-600"> For educational purposes only!</strong>
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="test" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="test">Live Testing</TabsTrigger>
            <TabsTrigger value="vulnerabilities">Backend Vulnerabilities</TabsTrigger>
            <TabsTrigger value="payloads">Attack Payloads</TabsTrigger>
            <TabsTrigger value="logs">Attack Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="test" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Live Vulnerability Testing</CardTitle>
                <CardDescription>
                  Test attack payloads and see real-time detection results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Test Payload</label>
                  <Textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Enter attack payload to test..."
                    rows={3}
                  />
                </div>
                <Button onClick={() => testVulnerability(testInput)}>
                  <Bug className="h-4 w-4 mr-2" />
                  Test Payload
                </Button>
                
                {detectionResults.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Detection Results:</h3>
                    <div className="space-y-2">
                      {detectionResults.map((result, index) => (
                        <Badge key={index} variant="destructive">
                          {result.type} Detected
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vulnerabilities" className="space-y-4">
            <div className="grid gap-4">
              {backendVulnerabilities.map((vuln, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{vuln.vulnerability}</CardTitle>
                        <CardDescription>{vuln.description}</CardDescription>
                      </div>
                      <Badge variant="destructive">{vuln.method}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><strong>Endpoint:</strong> {vuln.endpoint}</p>
                      <p><strong>Parameter:</strong> {vuln.parameter}</p>
                      <div className="flex items-center space-x-2">
                        <strong>Test Payload:</strong>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                          {vuln.testPayload}
                        </code>
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(vuln.testPayload)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="payloads" className="space-y-4">
            <div className="grid gap-4">
              {vulnerabilityTests.map((category, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{category.category}</CardTitle>
                      <Badge variant={category.severity === 'critical' ? 'destructive' : 'default'}>
                        {category.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {category.tests.map((test, testIndex) => (
                        <div key={testIndex} className="flex items-center space-x-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                            {test}
                          </code>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(test)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => {
                            setTestInput(test);
                            testVulnerability(test);
                          }}>
                            Test
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attack Detection Logs</CardTitle>
                <CardDescription>
                  View logged attack attempts and security events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button onClick={() => {
                    const logs = localStorage.getItem('attackLogs');
                    if (logs) {
                      const blob = new Blob([logs], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `attack_logs_${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                    }
                  }}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export Attack Logs
                  </Button>
                  
                  <Alert>
                    <Eye className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Monitoring Active:</strong> All inputs are being monitored for attack patterns.
                      Check browser console and local storage for detailed logs.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-red-600">⚠️ Important Security Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>This is a controlled honeypot environment.</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All activities are logged and monitored</li>
                  <li>Frontend code is intentionally not obfuscated for analysis</li>
                  <li>JWT tokens are used for session tracking</li>
                  <li>Multiple vulnerability vectors are intentionally exposed</li>
                  <li>Use only for authorized security testing</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HoneypotTestGuide;
