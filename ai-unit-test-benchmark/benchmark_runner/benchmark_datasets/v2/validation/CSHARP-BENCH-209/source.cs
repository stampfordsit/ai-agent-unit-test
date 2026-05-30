public class AgeValidator
{
    public bool ValidateAge(int age)
    {
        return age >= 18 && age <= 60;
    }
}