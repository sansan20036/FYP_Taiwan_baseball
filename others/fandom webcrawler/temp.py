"""
Programmer: LEE JE REL
Date: 30/4/2025
"""
def main():
    # Local variable
    name1, name2, name3, name4 = '', '', '', ''  # Store candidate names
    count1, count2, count3, count4 = 0,0,0,0      # Store vote counts for each candidate

    # Input candidate name
    name1 = get_name(name1, 1)
    name2 = get_name(name2, 2)
    name3 = get_name(name3, 3)
    name4 = get_name(name4, 4)

    # Initialize variables for voting loop
    candidate = 99
    tieBroke = 'Tie'
    tie = 'Tie'
    candidateINT = -1

#TODO("Prompt user to choose the candidate continously"); 
    while tieBroke == tie:     # Prompt user to choose a candidate continuously
        while candidate != 0:
            candidate = input('Choose candidates between 1 - 4, 0 to finish: ')
            if candidate == '1' or candidate == '2' or candidate == '3' or candidate == '4' or candidate == '0':    # Validate input to ensure it's a number between 0 and 4
                candidateINT = int(candidate)
            else:
                print('Please only enter integer numbers only!!!')
          
#TODO("Update the candidate count")
            if candidateINT == 1:
                count1 += 1
            elif candidateINT == 2:
                count2 += 1
            elif candidateINT == 3:
                count3 += 1
            elif candidateINT == 4:
                count4 += 1
            elif candidateINT == 0:
                break  # Exit the voting loop if input is 0
            else:
                print("Invalid input. Please enter a number from 0 to 4.")
    
        # Call function to find winner after voting ends
        tie = find_winner(count1,count2,count3,count4, name1, name2, name3, name4)

# Function to get candidate name input
def get_name(name, number):
    candidateName = 'Enter candidate '+ str(number)+ ' name: '  # Prompt string with candidate number
     
    while name == '' or name == ' ':    #  will keep looping until a valid name is entered
        input_name = input(candidateName)  
        name = input_name
        
        if name == ' ' or name == '':   # Validate non-empty and non-space name
            print('Please enter a name!!!!')
            continue
        else:
            return name  # Return valid name

#TODO("find the winner")
def find_winner(count1,count2,count3,count4, name1, name2, name3, name4):
    ties = 0  # Count how many candidates have the maximum votes
    maxWins = 0
    maxWins = max(count1,count2,count3,count4)  # Find highest vote count
    
    if maxWins == count1:   # Check which candidates have the max votes and track ties
        ties += 1
        winnerName = name1
    if maxWins == count2:
        ties += 1
        winnerName = name2
    if maxWins == count3:
        ties += 1
        winnerName = name3
    if maxWins == count4:
        ties += 1
        winnerName = name4
    
#TODO("print report for the winner")        
    if ties == 1:    
        print_winner(winnerName, maxWins)  # One winner found
    else:
        print('Result inconclusive, winner not found. Please vote again!!!')  # Tie occurred
        return 'Tie'  # Indicate tie to repeat voting

# Function to print the winner's name and vote count
def print_winner(name, maxWins):
    print("\nWinner is: ", name, ' with ', maxWins, ' wins.')
    
if __name__ == '__main__':
    main()  # Start the program
