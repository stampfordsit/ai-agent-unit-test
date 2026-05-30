public class MathService
{
    public async Task<int> DivideAsync(int a, int b)
    {
        await Task.Delay(50);

        if (b == 0)
            throw new DivideByZeroException();

        return a / b;
    }
}