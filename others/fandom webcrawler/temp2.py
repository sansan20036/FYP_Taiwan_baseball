"""
Programmer: LEE JE REL
Date: 30/4/2025
"""
def main():
    #Local variable
    name1, name2, name3, name4 = '', '', '', ''
    count1, count2, count3, count4 = 0,0,0,0

    #input candidate name
    name1 = get_name(name1, 1) 
    name2 = get_name(name2, 2)
    name3 = get_name(name3, 3)
    name4 = get_name(name4, 4)

    #TODO("Prompt user to choose the candidate continously");
    candidate = 99
    tieBroke = 'Tie'
    tie = 'Tie'
    candidateINT = -1
    while tieBroke == tie:
        while candidate != 0:
            candidate = input('Choose candidates between 1 - 4, 0 to finish: ')
            if candidate == '1' or candidate == '2' or candidate == '3' or candidate == '4' or candidate == '0':
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
                break
            else:
                print("Invalid input. Please enter a number from 0 to 4.")
    
        tie = find_winner(count1,count2,count3,count4, name1, name2, name3, name4)

def get_name(name, number):
    # name = 'name'
    candidateName = 'Enter candidate '+ str(number)+ ' name: '
     
    while name == '' or name == ' ':
        input_name = input(candidateName)  
        name = input_name
        
        if name == ' ' or name == '':
            print('Please enter a name!!!!')
            continue
        else:
            return name

#TODO("find the winner")
def find_winner(count1,count2,count3,count4, name1, name2, name3, name4):
    ties = 0
    maxWins = 0
    maxWins = max(count1,count2,count3,count4)
    #TODO("print report for the winner")
    if maxWins == count1:
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
        
    if ties == 1:    
        print_winner(winnerName, maxWins)
    else:
        print('Result inconclusive, winner not found. Please vote again!!!')
        return 'Tie'

def print_winner(name, maxWins):
    print("\nWinner is: ", name, ' with ', maxWins, ' wins.')
    
if __name__ == '__main__':
    main()