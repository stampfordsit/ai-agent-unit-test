public class MathService
{
    public double CalculateSquareRoot(double value)
    {
        if (value < 0)
            throw new ArgumentException();

        return Math.Sqrt(value);
    }
}