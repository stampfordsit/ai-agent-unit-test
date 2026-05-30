using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace RoslynParserCli
{
    public class MethodInfo
    {
        public string ClassName { get; set; } = "";
        public string MethodName { get; set; } = "";
        public string ReturnType { get; set; } = "";
        public List<string> Modifiers { get; set; } = new();
        public List<ParameterInfo> Parameters { get; set; } = new();
        public string Body { get; set; } = "";
    }

    public class ParameterInfo
    {
        public string Name { get; set; } = "";
        public string Type { get; set; } = "";
    }

    class Program
    {
        static void Main(string[] args)
        {
            if (args.Length < 1)
            {
                Console.WriteLine("Error: Missing input file path.");
                Console.WriteLine("Usage: RoslynParserCli <input-file-path> [output-json-path]");
                Environment.Exit(1);
            }

            string inputPath = args[0];
            string? outputPath = args.Length > 1 ? args[1] : null;

            if (!File.Exists(inputPath))
            {
                Console.WriteLine($"Error: File '{inputPath}' does not exist.");
                Environment.Exit(1);
            }

            try
            {
                string sourceCode = File.ReadAllText(inputPath);
                var tree = CSharpSyntaxTree.ParseText(sourceCode);
                var root = tree.GetCompilationUnitRoot();

                var methodsList = new List<MethodInfo>();

                var classDeclarations = root.DescendantNodes().OfType<ClassDeclarationSyntax>();
                foreach (var classDecl in classDeclarations)
                {
                    string className = classDecl.Identifier.Text;

                    var methodDeclarations = classDecl.Members.OfType<MethodDeclarationSyntax>();
                    foreach (var methodDecl in methodDeclarations)
                    {
                        // Extract method name
                        string methodName = methodDecl.Identifier.Text;

                        // Only select public methods
                        var modifiers = methodDecl.Modifiers.Select(m => m.Text).ToList();
                        if (!modifiers.Contains("public"))
                        {
                            continue;
                        }

                        string returnType = methodDecl.ReturnType.ToString();
                        string body = methodDecl.ToString();

                        var parameters = methodDecl.ParameterList.Parameters.Select(p => new ParameterInfo
                        {
                            Name = p.Identifier.Text,
                            Type = p.Type?.ToString() ?? "dynamic"
                        }).ToList();

                        methodsList.Add(new MethodInfo
                        {
                            ClassName = className,
                            MethodName = methodName,
                            ReturnType = returnType,
                            Modifiers = modifiers,
                            Parameters = parameters,
                            Body = body
                        });
                    }
                }

                var options = new JsonSerializerOptions { WriteIndented = true };
                string jsonString = JsonSerializer.Serialize(methodsList, options);

                if (outputPath != null)
                {
                    File.WriteAllText(outputPath, jsonString);
                    Console.WriteLine($"Successfully parsed {methodsList.Count} public methods and wrote to '{outputPath}'.");
                }
                else
                {
                    Console.WriteLine(jsonString);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Environment.Exit(1);
            }
        }
    }
}
