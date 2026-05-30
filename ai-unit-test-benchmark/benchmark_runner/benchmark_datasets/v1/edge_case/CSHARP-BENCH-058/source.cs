public class AgeValidator
{
    public bool ValidateAge(int age)
    {
        if (age < 0)
            return false;

        return age >= 18;
    }
}