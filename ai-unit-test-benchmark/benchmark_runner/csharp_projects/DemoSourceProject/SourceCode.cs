
            namespace BenchmarkSourceProject;
            public class SourceService
            {
            public int Divide(int numerator, int denominator)
{
    if (denominator == 0)
    {
        throw new System.DivideByZeroException("Denominator cannot be zero.");
    }
    return numerator / denominator;
}
            }
            