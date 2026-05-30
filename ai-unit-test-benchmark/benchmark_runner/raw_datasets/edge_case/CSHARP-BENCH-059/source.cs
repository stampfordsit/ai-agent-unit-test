public class TemperatureService
{
    public double ConvertToCelsius(double fahrenheit)
    {
        if (fahrenheit > 10000)
            throw new OverflowException();

        return (fahrenheit - 32) * 5 / 9;
    }
}