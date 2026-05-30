public int Divide(int a, int b)
{
    if (b == 0)
        throw new DivideByZeroException();

    return a / b;
}