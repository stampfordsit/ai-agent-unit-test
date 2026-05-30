public List<int> GetEvenNumbers(List<int> numbers)
{
    return numbers.Where(x => x % 2 == 0).ToList();
}